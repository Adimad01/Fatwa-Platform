import { useState } from "react";
import axios from "axios";

export default function FatwaPlatform() {
  const [selectedMadhhab, setSelectedMadhhab] = useState('');
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const madhahib = ['المالكي', 'الحنبلي', 'الشافعي', 'الحنفي'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedMadhhab) return;

    const question = input.trim();
    setChat(prev => [...prev, { from: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/api/ask", {
        question,
        madhhab: selectedMadhhab
      }, {
        headers: { "Content-Type": "application/json" }
      });

      const botAnswer = response.data?.answer || "لم يتم التوصل لإجابة.";
      setChat(prev => [...prev, { from: 'bot', text: botAnswer }]);
    } catch (err) {
      console.error("[Error]", err);
      setChat(prev => [...prev, { from: 'bot', text: "حدث خطأ أثناء معالجة سؤالك." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Noto Kufi Arabic, sans-serif', background: 'linear-gradient(to bottom right, #121212, #000)', color: 'white' }}>
      <main style={{ flex: 4, display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
        <header style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'black', borderBottom: '2px solid #FFD700', color: '#FFD700' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>المنصة الشرعية للفتوى</h1>
        </header>

        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          <div style={{ direction: 'rtl', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {chat.map((msg, idx) => (
              <div key={idx} style={{
                backgroundColor: msg.from === 'user' ? '#2d2d2d' : '#FFF8DC',
                color: msg.from === 'user' ? 'white' : 'black',
                border: '1px solid #FFD700',
                padding: '1rem',
                borderRadius: '1rem'
              }}>{msg.text}</div>
            ))}
            {loading && (
              <div style={{ color: '#FFD700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="animate-spin" style={{ width: '1rem', height: '1rem', border: '2px solid #FFD700', borderTop: '2px solid transparent', borderRadius: '50%' }}></div>
                <span>الإجابة قيد التحميل...</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ borderTop: '2px solid #FFD700', backgroundColor: '#1b1b1b', padding: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب سؤالك الشرعي هنا..."
            style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid #FFD700', backgroundColor: 'black', color: 'white', direction: 'rtl' }}
          />
          <button type="submit" style={{ backgroundColor: '#FFD700', color: 'black', padding: '0.5rem 1.5rem', borderRadius: '0.75rem', border: 'none', fontWeight: 'bold' }}>إرسال</button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#FFD700', padding: '0.5rem', borderTop: '1px solid #FFD700', backgroundColor: '#121212' }}>
          إذا كنت ترغب في دعمنا، يمكنك   <a href="https://ko-fi.com/fatwaplatform" style={{ color: '#FFD700', textDecoration: 'underline' }}>التبرع</a>
        </div>
      </main>

      <aside style={{ flex: 1, backgroundColor: '#101010', borderLeft: '2px solid #FFD700', padding: '2rem 1rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FFD700', marginBottom: '2rem' }}>المذهب الفقهي</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {madhahib.map((madhhab) => (
            <li
              key={madhhab}
              onClick={() => setSelectedMadhhab(madhhab)}
              style={{
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                borderRadius: '0.75rem',
                backgroundColor: selectedMadhhab === madhhab ? '#FFD700' : 'transparent',
                color: selectedMadhhab === madhhab ? 'black' : '#FFD700',
                fontWeight: selectedMadhhab === madhhab ? 'bold' : 'normal'
              }}
            >
              {madhhab}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
