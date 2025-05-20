from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.vectorstores.faiss import FAISS as FAISSStore
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from typing import Optional
import os
import cohere
from dotenv import load_dotenv

load_dotenv()

co = cohere.Client(os.getenv("COHERE_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    question: str
    madhhab: str

retrievers = {}

def init_retrievers():
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    madhahib = ["المالكي", "الحنبلي", "الشافعي", "الحنفي"]
    for madhhab in madhahib:
        path = f"./data/{madhhab}.txt"
        if os.path.exists(path):
            loader = TextLoader(path, encoding="utf-8")
            docs = loader.load()
            chunks = CharacterTextSplitter(chunk_size=300, chunk_overlap=30).split_documents(docs)
            if not chunks:
                print(f"[WARN] No chunks created for {madhhab}")
                continue
            store = FAISSStore.from_documents(chunks, embedding_model)
            retriever = store.as_retriever()
            retriever.search_kwargs["k"] = 3
            retrievers[madhhab] = retriever
            print(f"[OK] {madhhab} knowledge loaded with {len(chunks)} chunks.")
        else:
            print(f"[WARN] Missing file: {path}")

@app.on_event("startup")
def startup():
    init_retrievers()

@app.post("/api/ask")
async def ask_fatwa(query: Query):
    if query.madhhab not in retrievers:
        return {"answer": "المذهب غير موجود."}

    retriever = retrievers[query.madhhab]
    docs = retriever.get_relevant_documents(query.question)
    context = "\n".join([doc.page_content for doc in docs])

    prompt = f"""

أنت مفتي مختص في فقه المذهب {query.madhhab}.

إذا وجدت الجواب في السياق المقدم، فاستند إليه. وإن لم تجده، يمكنك الاستعانة بمعرفتك الموسوعية العامة حول المذهب {query.madhhab}، شريطة أن تلتزم برأيه المعتمد.

لا تدخل آراء من خارج هذا المذهب.

السياق:
{context}

السؤال: {query.question}
الجواب:
"""

    response = co.chat(
        model="command-r-plus",
        message=prompt,
        temperature=0.5
    )

    return {
        "answer": response.text.strip(),
        "sources": [doc.metadata.get("source", "") for doc in docs]
    }