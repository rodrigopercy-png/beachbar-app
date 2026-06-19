import { useState, useEffect, useRef } from "react";

// ── Design tokens ──────────────────────────────────────────────────────────
// Palette: Deep ocean navy + warm sand + coral accent + sea-glass green
// Typography: "Syne" display (bold, geometric beach feel) + "Inter" body
// Signature: animated wave divider + sunny amber badges
const COLORS = {
  navy: "#0D2137",
  navyLight: "#163350",
  sand: "#F5EDD8",
  sandDark: "#E8D9B8",
  coral: "#E8614D",
  coralLight: "#FF8575",
  seaGlass: "#3AAFA9",
  seaGlassDark: "#2B8E8A",
  amber: "#F5A623",
  white: "#FFFFFF",
  gray100: "#F8F9FA",
  gray200: "#E9ECEF",
  gray400: "#ADB5BD",
  gray600: "#6C757D",
  gray800: "#343A40",
  success: "#28A745",
  warning: "#FFC107",
  danger: "#DC3545",
};

// ── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_MENU = {
  comidas: [
    { id: 1, name: "Peixe Frito", desc: "Peixe fresco com batata frita", price: 38, emoji: "🐟", popular: true },
    { id: 2, name: "Caldinho de Sururu", desc: "Tradicional caldinho nordestino", price: 14, emoji: "🍲", popular: true },
    { id: 3, name: "Tapioca Recheada", desc: "Queijo coalho e carne de sol", price: 18, emoji: "🫓" },
    { id: 4, name: "Moqueca de Camarão", desc: "Com azeite de dendê e leite de coco", price: 65, emoji: "🦐" },
  ],
  porcoes: [
    { id: 5, name: "Porção de Camarão", desc: "400g grelhado ou frito", price: 55, emoji: "🍤" },
    { id: 6, name: "Isca de Peixe", desc: "350g com molho tártaro", price: 42, emoji: "🍽️", popular: true },
    { id: 7, name: "Batata Frita", desc: "Com cheddar e bacon", price: 26, emoji: "🍟" },
    { id: 8, name: "Polvo na Brasa", desc: "Com azeite e limão siciliano", price: 78, emoji: "🐙" },
  ],
  bebidas: [
    { id: 9, name: "Caipirinha", desc: "Limão, morango ou maracujá", price: 22, emoji: "🍹", popular: true },
    { id: 10, name: "Água de Coco", desc: "Natural gelada", price: 10, emoji: "🥥" },
    { id: 11, name: "Cerveja Artesanal", desc: "IPA ou Weiss 600ml", price: 18, emoji: "🍺" },
    { id: 12, name: "Limonada Suíça", desc: "Com leite condensado", price: 16, emoji: "🍋" },
    { id: 13, name: "Suco Natural", desc: "Açaí, cajá ou tamarindo", price: 14, emoji: "🥤" },
    { id: 14, name: "Refrigerante", desc: "350ml gelado", price: 8, emoji: "🥃" },
  ],
};

const MOCK_ORDERS = [
  { id: "P001", umbrella: 7, client: "Maria S.", items: ["Caipirinha x2", "Porção de Camarão"], total: 99, status: "preparando", time: "12:34", waiterId: "w1" },
  { id: "P002", umbrella: 12, client: "João P.", items: ["Peixe Frito", "Água de Coco x2"], total: 58, status: "entregando", time: "12:41", waiterId: "w2" },
  { id: "P003", umbrella: 3, client: "Ana R.", items: ["Batata Frita", "Cerveja x3"], total: 80, status: "aguardando", time: "12:55", waiterId: null },
  { id: "P004", umbrella: 18, client: "Carlos M.", items: ["Moqueca de Camarão", "Caipirinha"], total: 87, status: "entregue", time: "12:20", waiterId: "w1" },
];

const MOCK_STATS = {
  todayRevenue: 3847.50,
  avgDeliveryTime: 14,
  activeUmbrellas: 23,
  totalOrders: 67,
  avgTicket: 57.43,
  umbrellaTop: [
    { num: 7, revenue: 287 }, { num: 12, revenue: 245 }, { num: 3, revenue: 198 },
  ],
  hourlyData: [9,11,14,10,18,22,25,20,16,12,8,5],
};

const FALLBACK_AI_TIPS = [
  "☀️ Mesa 7 pediu 2 caipirinhas — hora de sugerir a porção de camarão (harmonização perfeita!)",
  "🕐 Mesa 12 está há 18 min sem novo pedido — ofereça uma sobremesa ou café.",
  "🔥 Item mais vendido hoje: Caipirinha de Maracujá. Sugira para novas mesas!",
  "💡 Mesa 3 pediu só bebida — proponha o combo peixe frito + batata para o almoço.",
];

// Full menu as a flat reference list, used as context for the AI
const ALL_MENU_ITEMS = [
  ...MOCK_MENU.comidas, ...MOCK_MENU.porcoes, ...MOCK_MENU.bebidas,
];

// ── QR CODE GENERATOR (pure JS via CDN lib, loaded once) ────────────────────
function useQRCode(text, size = 200) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !text) return;
    let cancelled = false;

    (async () => {
      try {
        if (!window.QRCodeLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          window.QRCodeLib = window.QRCode;
        }
        if (cancelled) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = size;
        canvas.height = size;
        ctx.clearRect(0, 0, size, size);

        const tempDiv = document.createElement("div");
        new window.QRCodeLib(tempDiv, {
          text, width: size, height: size,
          colorDark: "#0D2137", colorLight: "#FFFFFF",
          correctLevel: window.QRCodeLib.CorrectLevel.M,
        });
        setTimeout(() => {
          if (cancelled) return;
          const innerCanvas = tempDiv.querySelector("canvas");
          const innerImg = tempDiv.querySelector("img");
          if (innerCanvas) {
            ctx.drawImage(innerCanvas, 0, 0, size, size);
          } else if (innerImg) {
            const im = new Image();
            im.crossOrigin = "anonymous";
            im.onload = () => ctx.drawImage(im, 0, 0, size, size);
            im.src = innerImg.src;
          }
        }, 100);
      } catch (e) {
        console.error("QR generation failed", e);
      }
    })();

    return () => { cancelled = true; };
  }, [text, size]);

  return canvasRef;
}

function QRCodeView({ value, size = 200, label }) {
  const canvasRef = useQRCode(value, size);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{
        background: COLORS.white, padding: 12, borderRadius: 12,
        boxShadow: "0 4px 16px rgba(13,33,55,0.12)", border: `2px solid ${COLORS.gray200}`,
      }}>
        <canvas ref={canvasRef} width={size} height={size} style={{ display: "block" }} />
      </div>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy }}>{label}</div>}
    </div>
  );
}

// ── AI INTEGRATION (Anthropic API) ───────────────────────────────────────────
async function getAIWaiterTips({ orders, menuItems }) {
  try {
    const menuSummary = menuItems.map(m => `${m.name} (R$${m.price})`).join(", ");
    const ordersSummary = orders.map(o =>
      `Guarda-sol #${o.umbrella}: pediu ${o.items.join(", ")} às ${o.time}, status ${o.status}`
    ).join("\n");

    const prompt = `Você é um assistente de IA para garçons de uma barraca de praia no Brasil.
Cardápio disponível: ${menuSummary}

Pedidos ativos:
${ordersSummary}

Gere exatamente 4 dicas curtas e práticas (cada uma com no máximo 140 caracteres, em português do Brasil, com 1 emoji no início) para o garçom oferecer produtos complementares (upsell) baseado no consumo de cada guarda-sol, ou para reativar mesas sem pedido recente.

Responda APENAS em formato JSON, sem markdown, sem texto adicional, no formato:
{"tips": ["dica 1", "dica 2", "dica 3", "dica 4"]}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const textBlock = data.content?.find(b => b.type === "text");
    if (!textBlock) throw new Error("No text response");

    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed.tips) && parsed.tips.length > 0 ? parsed.tips : FALLBACK_AI_TIPS;
  } catch (e) {
    console.error("AI tip generation failed, using fallback:", e);
    return FALLBACK_AI_TIPS;
  }
}

// ── CSS-in-JS helper ────────────────────────────────────────────────────────
const css = (styles) => Object.entries(styles).reduce((acc, [k, v]) => {
  const prop = k.replace(/([A-Z])/g, "-$1").toLowerCase();
  return acc + `${prop}:${v};`;
}, "");

// ── Components ──────────────────────────────────────────────────────────────

function WaveIcon({ size = 24, color = COLORS.white }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 48 24" fill="none">
      <path d="M0 12 C8 4 16 4 24 12 C32 20 40 20 48 12" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function Badge({ children, color = COLORS.amber, textColor = COLORS.navy }) {
  return (
    <span style={{
      background: color, color: textColor,
      padding: "2px 10px", borderRadius: 20, fontSize: 11,
      fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
    }}>{children}</span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: COLORS.white, borderRadius: 16,
      padding: "20px", boxShadow: "0 2px 16px rgba(13,33,55,0.08)",
      ...style
    }}>{children}</div>
  );
}

function Button({ children, onClick, variant = "primary", size = "md", style = {}, disabled = false }) {
  const base = {
    border: "none", borderRadius: 12, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s", fontFamily: "inherit",
    display: "inline-flex", alignItems: "center", gap: 8,
    opacity: disabled ? 0.6 : 1,
  };
  const sizes = {
    sm: { padding: "8px 16px", fontSize: 13 },
    md: { padding: "12px 24px", fontSize: 15 },
    lg: { padding: "16px 32px", fontSize: 17 },
  };
  const variants = {
    primary: { background: COLORS.coral, color: COLORS.white },
    secondary: { background: COLORS.seaGlass, color: COLORS.white },
    ghost: { background: "transparent", color: COLORS.navy, border: `2px solid ${COLORS.navy}` },
    navy: { background: COLORS.navy, color: COLORS.white },
    success: { background: COLORS.success, color: COLORS.white },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    aguardando: { label: "Aguardando", color: COLORS.warning, text: "#333" },
    preparando: { label: "Preparando", color: COLORS.seaGlass, text: COLORS.white },
    entregando: { label: "A Caminho", color: COLORS.amber, text: COLORS.navy },
    entregue: { label: "Entregue", color: COLORS.success, text: COLORS.white },
  };
  const s = map[status] || map.aguardando;
  return <Badge color={s.color} textColor={s.text}>{s.label}</Badge>;
}

// ── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState(null);
  const [umbrella, setUmbrella] = useState("");
  const [step, setStep] = useState("role");
  const [fromQR, setFromQR] = useState(false);

  // If the client arrived via a QR code scan (?guardasol=N), skip straight to login
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qrUmbrella = params.get("guardasol");
      if (qrUmbrella) {
        setUmbrella(qrUmbrella);
        setRole("client");
        setStep("umbrella");
        setFromQR(true);
      }
    } catch (e) { /* no-op */ }
  }, []);

  const handleGoogleLogin = (selectedRole) => {
    const user = {
      name: selectedRole === "client" ? "Maria Silva" : selectedRole === "admin" ? "Superadmin" : "João Garçom",
      email: selectedRole === "client" ? "maria@email.com" : selectedRole === "admin" ? "admin@barraca.com" : "garcom@barraca.com",
      role: selectedRole,
      photo: null,
      umbrella: selectedRole === "client" ? parseInt(umbrella) || 7 : null,
      isRecurring: selectedRole === "client",
    };
    onLogin(user);
  };

  return (
    <div style={{
      minHeight: "100vh", background: `linear-gradient(160deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 50%, ${COLORS.seaGlassDark} 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative", overflow: "hidden",
    }}>
      {/* Decorative waves */}
      {[0,1,2].map(i => (
        <div key={i} style={{
          position: "absolute", bottom: 60 + i * 40, left: 0, right: 0,
          opacity: 0.08 + i * 0.04,
        }}>
          <svg viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none" style={{ width: "100%", height: 80 }}>
            <path d={`M0 40 C240 ${10 + i*10} 480 ${70 - i*10} 720 40 C960 ${10+i*10} 1200 ${70-i*10} 1440 40 L1440 80 L0 80 Z`} fill={COLORS.seaGlass}/>
          </svg>
        </div>
      ))}

      <div style={{ textAlign: "center", marginBottom: 40, zIndex: 1 }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🏖️</div>
        <h1 style={{ color: COLORS.white, fontSize: 36, fontWeight: 900, margin: 0, letterSpacing: -1, fontFamily: "Syne, Inter, sans-serif" }}>
          BeachBar
        </h1>
        <p style={{ color: COLORS.seaGlass, margin: "8px 0 0", fontSize: 14, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>
          Seu pedido, sem sair do sol
        </p>
      </div>

      <Card style={{ maxWidth: 380, width: "100%", zIndex: 1 }}>
        {step === "role" && (
          <>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, color: COLORS.navy, fontWeight: 800 }}>Como deseja entrar?</h2>
            <p style={{ color: COLORS.gray600, fontSize: 13, margin: "0 0 20px", lineHeight: 1.5 }}>
              🔒 Seus dados são protegidos pela LGPD. Ao entrar, você consente com nossa política de privacidade.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Button onClick={() => { setRole("client"); setStep("umbrella"); }} variant="primary" size="lg" style={{ width: "100%", justifyContent: "center" }}>
                ☀️ Sou Cliente
              </Button>
              <Button onClick={() => handleGoogleLogin("waiter")} variant="secondary" size="lg" style={{ width: "100%", justifyContent: "center" }}>
                🤿 Sou Garçom
              </Button>
              <Button onClick={() => handleGoogleLogin("admin")} variant="navy" size="lg" style={{ width: "100%", justifyContent: "center" }}>
                🎛️ Administrativo
              </Button>
            </div>
            <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: COLORS.gray400 }}>
              Autenticação segura via Google OAuth 2.0 · LGPD compliant
            </p>
          </>
        )}
        {step === "umbrella" && (
          <>
            <button onClick={() => setStep("role")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.gray600, marginBottom: 16, padding: 0, fontSize: 14 }}>
              ← Voltar
            </button>
            {fromQR && (
              <div style={{ marginBottom: 16 }}>
                <Badge color={COLORS.success}>✅ Detectado via QR Code</Badge>
              </div>
            )}
            <h2 style={{ margin: "0 0 8px", fontSize: 20, color: COLORS.navy, fontWeight: 800 }}>Qual é o seu guarda-sol?</h2>
            <p style={{ color: COLORS.gray600, fontSize: 13, marginBottom: 20 }}>O número está no QR Code da sua sombrinha 🏖️</p>
            <input
              type="number" placeholder="Ex: 07"
              value={umbrella} onChange={e => setUmbrella(e.target.value)}
              style={{
                width: "100%", padding: "16px", fontSize: 32, fontWeight: 800,
                textAlign: "center", border: `2px solid ${COLORS.gray200}`,
                borderRadius: 12, boxSizing: "border-box", color: COLORS.navy,
                outline: "none", fontFamily: "inherit",
              }}
            />
            <Button
              onClick={() => handleGoogleLogin("client")}
              disabled={!umbrella}
              variant="primary" size="lg"
              style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
            >
              🔑 Entrar com Google
            </Button>
            <p style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: COLORS.gray400 }}>
              Usaremos seu e-mail apenas para enviar promoções (você pode cancelar a qualquer momento)
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

// ── CLIENT APP ───────────────────────────────────────────────────────────────
function ClientApp({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("comidas");
  const [cart, setCart] = useState([]);
  const [orderSent, setOrderSent] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [orders, setOrders] = useState([]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      return existing
        ? prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (!existing) return prev;
      return existing.qty === 1 ? prev.filter(i => i.id !== id) : prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const sendOrder = () => {
    const order = {
      id: `P${Date.now().toString().slice(-3)}`,
      items: cart.map(i => `${i.name} x${i.qty}`),
      total: cartTotal,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      status: "aguardando",
    };
    setOrders(prev => [order, ...prev]);
    setCart([]);
    setOrderSent(true);
    setShowCart(false);
    setTimeout(() => setOrderSent(false), 4000);
  };

  const tabs = ["comidas", "porcoes", "bebidas"];
  const tabLabels = { comidas: "🍽️ Comidas", porcoes: "🍤 Porções", bebidas: "🍹 Bebidas" };

  if (orderSent) return (
    <div style={{
      minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.seaGlass}, ${COLORS.navy})`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      color: COLORS.white, textAlign: "center", padding: 32,
    }}>
      <div style={{ fontSize: 80 }}>🎉</div>
      <h2 style={{ fontSize: 28, fontWeight: 900, margin: "16px 0 8px" }}>Pedido Enviado!</h2>
      <p style={{ opacity: 0.8, fontSize: 15 }}>Seu garçom chegará em breve ao guarda-sol <strong>#{user.umbrella}</strong></p>
      <div style={{ marginTop: 32, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 24px" }}>
        <p style={{ margin: 0, fontSize: 13 }}>⏱️ Tempo estimado: <strong>15-20 min</strong></p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: COLORS.sand, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: COLORS.navy, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <div style={{ color: COLORS.seaGlass, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Guarda-sol</div>
          <div style={{ color: COLORS.white, fontSize: 22, fontWeight: 900 }}>#{user.umbrella}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user.isRecurring && <Badge color={COLORS.amber}>⭐ Cliente VIP</Badge>}
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: COLORS.coral, display: "flex", alignItems: "center", justifyContent: "center",
            color: COLORS.white, fontWeight: 700, fontSize: 14, cursor: "pointer",
          }} onClick={onLogout}>
            {user.name[0]}
          </div>
        </div>
      </div>

      {/* LGPD notice */}
      <div style={{ background: COLORS.navyLight, padding: "8px 20px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, color: COLORS.gray400 }}>🔒 Seus dados são armazenados com segurança · LGPD · Privacidade</span>
      </div>

      {/* Welcome banner */}
      <div style={{ background: `linear-gradient(90deg, ${COLORS.coral}, ${COLORS.coralLight})`, padding: "16px 20px", color: COLORS.white }}>
        <div style={{ fontSize: 13, opacity: 0.9 }}>Olá, {user.name.split(" ")[0]}! 👋</div>
        <div style={{ fontWeight: 800, fontSize: 16 }}>O que vai querer hoje?</div>
      </div>

      {/* Tabs */}
      <div style={{ background: COLORS.white, display: "flex", borderBottom: `2px solid ${COLORS.gray200}`, position: "sticky", top: 73, zIndex: 90 }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: "14px 4px", border: "none", background: "none",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            color: activeTab === tab ? COLORS.coral : COLORS.gray600,
            borderBottom: activeTab === tab ? `3px solid ${COLORS.coral}` : "3px solid transparent",
            transition: "all 0.2s", fontFamily: "inherit",
          }}>
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div style={{ padding: "16px 16px 120px" }}>
        {MOCK_MENU[activeTab].map(item => {
          const inCart = cart.find(i => i.id === item.id);
          return (
            <Card key={item.id} style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 14, padding: 16 }}>
              <div style={{ fontSize: 40, flexShrink: 0 }}>{item.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: COLORS.navy }}>{item.name}</span>
                  {item.popular && <Badge color={COLORS.amber} textColor={COLORS.navy}>🔥 Top</Badge>}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: COLORS.gray600 }}>{item.desc}</p>
                <div style={{ marginTop: 6, fontWeight: 900, fontSize: 17, color: COLORS.coral }}>R$ {item.price.toFixed(2)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {inCart && (
                  <>
                    <button onClick={() => removeFromCart(item.id)} style={{
                      width: 32, height: 32, borderRadius: "50%", border: "none",
                      background: COLORS.gray200, cursor: "pointer", fontWeight: 900, fontSize: 18, color: COLORS.navy,
                    }}>−</button>
                    <span style={{ fontWeight: 800, fontSize: 16, minWidth: 16, textAlign: "center" }}>{inCart.qty}</span>
                  </>
                )}
                <button onClick={() => addToCart(item)} style={{
                  width: 32, height: 32, borderRadius: "50%", border: "none",
                  background: COLORS.coral, cursor: "pointer", fontWeight: 900, fontSize: 18, color: COLORS.white,
                }}>+</button>
              </div>
            </Card>
          );
        })}

        {/* My orders */}
        {orders.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, color: COLORS.navy, fontWeight: 800, marginBottom: 12 }}>📦 Meus Pedidos</h3>
            {orders.map(o => (
              <Card key={o.id} style={{ marginBottom: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{o.id} · {o.time}</div>
                    <div style={{ fontSize: 12, color: COLORS.gray600, marginTop: 2 }}>{o.items.join(", ")}</div>
                    <div style={{ fontWeight: 800, color: COLORS.coral, marginTop: 4 }}>R$ {o.total.toFixed(2)}</div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <div style={{
          position: "fixed", bottom: 24, left: 16, right: 16,
          background: COLORS.navy, borderRadius: 16, padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 8px 32px rgba(13,33,55,0.4)", cursor: "pointer", zIndex: 200,
        }} onClick={() => setShowCart(true)}>
          <div>
            <div style={{ color: COLORS.gray400, fontSize: 12 }}>{cartCount} ite{cartCount > 1 ? "ns" : "m"}</div>
            <div style={{ color: COLORS.white, fontWeight: 900, fontSize: 18 }}>R$ {cartTotal.toFixed(2)}</div>
          </div>
          <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); setShowCart(true); }}>
            Ver carrinho →
          </Button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300,
          display: "flex", alignItems: "flex-end",
        }} onClick={() => setShowCart(false)}>
          <div style={{
            background: COLORS.white, borderRadius: "20px 20px 0 0",
            padding: 24, width: "100%", maxHeight: "80vh", overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 900, color: COLORS.navy }}>🛒 Seu Pedido</h3>
            {cart.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.gray200}` }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{item.emoji} {item.name} x{item.qty}</span>
                <span style={{ fontWeight: 800, color: COLORS.coral }}>R$ {(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", margin: "16px 0", fontWeight: 900, fontSize: 18, color: COLORS.navy }}>
              <span>Total</span>
              <span style={{ color: COLORS.coral }}>R$ {cartTotal.toFixed(2)}</span>
            </div>
            <div style={{ background: COLORS.sand, borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: COLORS.gray600 }}>
              📍 Entrega no guarda-sol <strong>#{user.umbrella}</strong>
            </div>
            <Button variant="primary" size="lg" onClick={sendOrder} style={{ width: "100%", justifyContent: "center" }}>
              ✅ Confirmar Pedido
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── WAITER APP ───────────────────────────────────────────────────────────────
function WaiterApp({ user, onLogout }) {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [currentTip, setCurrentTip] = useState(0);
  const [showTip, setShowTip] = useState(true);
  const [aiTips, setAiTips] = useState(FALLBACK_AI_TIPS);
  const [loadingTips, setLoadingTips] = useState(true);

  // Fetch real AI-generated tips based on current orders + menu
  useEffect(() => {
    let cancelled = false;
    setLoadingTips(true);
    getAIWaiterTips({ orders, menuItems: ALL_MENU_ITEMS }).then(tips => {
      if (!cancelled) {
        setAiTips(tips);
        setLoadingTips(false);
      }
    });
    return () => { cancelled = true; };
  }, []); // initial load; could re-trigger when orders meaningfully change

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(t => (t + 1) % aiTips.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [aiTips.length]);

  const updateStatus = (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const myOrders = orders.filter(o => o.waiterId === "w1" || o.waiterId === null);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.sand, fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: COLORS.seaGlassDark, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Modo Garçom</div>
          <div style={{ color: COLORS.white, fontSize: 18, fontWeight: 900 }}>{user.name} 🤿</div>
        </div>
        <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: COLORS.white, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          Sair
        </button>
      </div>

      {/* AI Tip Banner */}
      {showTip && (
        <div style={{ background: COLORS.amber, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: COLORS.navy, marginBottom: 4, letterSpacing: 1 }}>
              {loadingTips ? "🤖 IA analisando pedidos..." : "💡 Dica da IA"}
            </div>
            <div style={{ fontSize: 13, color: COLORS.navy, fontWeight: 600, lineHeight: 1.4 }}>
              {loadingTips ? "Gerando sugestões personalizadas com base no consumo das mesas..." : aiTips[currentTip]}
            </div>
          </div>
          <button onClick={() => setShowTip(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: COLORS.navy, padding: "0 0 0 12px", flexShrink: 0 }}>×</button>
        </div>
      )}

      <div style={{ padding: "16px 16px 32px" }}>
        <h3 style={{ fontSize: 16, color: COLORS.navy, fontWeight: 800, marginBottom: 12 }}>
          📋 Pedidos Ativos ({myOrders.filter(o => o.status !== "entregue").length})
        </h3>
        {myOrders.map(order => (
          <Card key={order.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 900, fontSize: 16, color: COLORS.navy }}>☂️ #{order.umbrella}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div style={{ fontSize: 12, color: COLORS.gray600, marginTop: 4 }}>
                  {order.client} · {order.time}
                </div>
              </div>
              <div style={{ fontWeight: 900, fontSize: 18, color: COLORS.coral }}>
                R$ {order.total}
              </div>
            </div>
            <div style={{ background: COLORS.gray100, borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ fontSize: 13, color: COLORS.gray800, padding: "2px 0" }}>• {item}</div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {order.status === "aguardando" && (
                <Button size="sm" variant="secondary" onClick={() => updateStatus(order.id, "preparando")}>
                  ✅ Aceitar
                </Button>
              )}
              {order.status === "preparando" && (
                <Button size="sm" variant="primary" onClick={() => updateStatus(order.id, "entregando")}>
                  🚶 Saí para entregar
                </Button>
              )}
              {order.status === "entregando" && (
                <Button size="sm" variant="success" onClick={() => updateStatus(order.id, "entregue")}>
                  ✓ Entregue
                </Button>
              )}
              {order.status === "entregue" && (
                <span style={{ fontSize: 12, color: COLORS.success, fontWeight: 700 }}>✓ Concluído</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [orders] = useState(MOCK_ORDERS);
  const [aiInsights, setAiInsights] = useState(FALLBACK_AI_TIPS.slice(0, 3));
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [umbrellaCount, setUmbrellaCount] = useState(25);
  const [baseUrl, setBaseUrl] = useState(() =>
    typeof window !== "undefined" ? window.location.origin + window.location.pathname : "https://beachbar.app"
  );

  useEffect(() => {
    let cancelled = false;
    getAIWaiterTips({ orders, menuItems: ALL_MENU_ITEMS }).then(tips => {
      if (!cancelled) {
        setAiInsights(tips);
        setLoadingInsights(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const StatCard = ({ label, value, sub, color = COLORS.navy, icon }) => (
    <Card style={{ flex: 1, minWidth: 130, padding: "16px" }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.gray600, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: COLORS.gray400, marginTop: 2 }}>{sub}</div>}
    </Card>
  );

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "orders", label: "Pedidos", icon: "📋" },
    { id: "menu", label: "Cardápio", icon: "🍽️" },
    { id: "qrcodes", label: "QR Codes", icon: "🔲" },
    { id: "clients", label: "Clientes", icon: "👥" },
    { id: "settings", label: "Config.", icon: "⚙️" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.gray100, fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ background: COLORS.navy, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🏖️</span>
          <div>
            <div style={{ color: COLORS.white, fontWeight: 900, fontSize: 16 }}>BeachBar Admin</div>
            <div style={{ color: COLORS.seaGlass, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
              {user.role === "superadmin" ? "⭐ Super Administrador" : "Administrador"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge color={COLORS.success}>● Ao vivo</Badge>
          <button onClick={onLogout} style={{ background: "none", border: "none", color: COLORS.gray400, cursor: "pointer", fontSize: 12 }}>Sair</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.gray200}`, display: "flex", overflowX: "auto" }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveSection(item.id)} style={{
            flexShrink: 0, padding: "12px 20px", border: "none", background: "none",
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            color: activeSection === item.id ? COLORS.coral : COLORS.gray600,
            borderBottom: activeSection === item.id ? `3px solid ${COLORS.coral}` : "3px solid transparent",
          }}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: "20px 16px 40px", overflowY: "auto" }}>
        {activeSection === "dashboard" && (
          <>
            <h2 style={{ margin: "0 0 16px", fontSize: 20, color: COLORS.navy, fontWeight: 900 }}>📊 Visão Geral — Hoje</h2>

            {/* KPIs */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <StatCard icon="💰" label="Faturamento" value={`R$ ${MOCK_STATS.todayRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color={COLORS.success} />
              <StatCard icon="📦" label="Pedidos" value={MOCK_STATS.totalOrders} sub="hoje" />
              <StatCard icon="⏱️" label="Entrega média" value={`${MOCK_STATS.avgDeliveryTime} min`} color={MOCK_STATS.avgDeliveryTime > 20 ? COLORS.danger : COLORS.seaGlass} />
              <StatCard icon="☂️" label="Mesas ativas" value={MOCK_STATS.activeUmbrellas} sub="guarda-sóis" />
            </div>

            {/* Hourly chart */}
            <Card style={{ marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: COLORS.navy }}>📈 Pedidos por hora</h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                {MOCK_STATS.hourlyData.map((v, i) => {
                  const max = Math.max(...MOCK_STATS.hourlyData);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{
                        width: "100%", height: `${(v / max) * 72}px`,
                        background: i === 5 ? COLORS.coral : COLORS.seaGlass,
                        borderRadius: "4px 4px 0 0", transition: "height 0.3s",
                      }}/>
                      <span style={{ fontSize: 8, color: COLORS.gray400 }}>{8 + i}h</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Top Umbrellas */}
            <Card style={{ marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: COLORS.navy }}>☂️ Guarda-sóis Top</h3>
              {MOCK_STATS.umbrellaTop.map((u, i) => (
                <div key={u.num} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? `1px solid ${COLORS.gray200}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 900, color: COLORS.amber, fontSize: 16 }}>#{i + 1}</span>
                    <span style={{ fontWeight: 700 }}>Guarda-sol {u.num}</span>
                  </div>
                  <span style={{ fontWeight: 900, color: COLORS.coral }}>R$ {u.revenue}</span>
                </div>
              ))}
            </Card>

            {/* AI Insights */}
            <Card>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: COLORS.navy }}>
                🤖 Insights da IA {loadingInsights && <span style={{ fontSize: 11, color: COLORS.gray400, fontWeight: 400 }}>(gerando...)</span>}
              </h3>
              {aiInsights.slice(0, 3).map((tip, i) => (
                <div key={i} style={{ padding: "10px 12px", background: COLORS.sand, borderRadius: 8, marginBottom: 8, fontSize: 13, lineHeight: 1.5, color: COLORS.navy }}>
                  {tip}
                </div>
              ))}
            </Card>
          </>
        )}

        {activeSection === "orders" && (
          <>
            <h2 style={{ margin: "0 0 16px", fontSize: 20, color: COLORS.navy, fontWeight: 900 }}>📋 Todos os Pedidos</h2>
            {orders.map(order => (
              <Card key={order.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 900 }}>☂️ #{order.umbrella}</span>
                      <span style={{ fontSize: 13, color: COLORS.gray600 }}>{order.id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.gray600 }}>{order.client} · {order.time}</div>
                    <div style={{ fontSize: 12, color: COLORS.gray400, marginTop: 4 }}>{order.items.join(", ")}</div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: COLORS.coral }}>R$ {order.total}</div>
                </div>
              </Card>
            ))}
          </>
        )}

        {activeSection === "clients" && (
          <>
            <h2 style={{ margin: "0 0 16px", fontSize: 20, color: COLORS.navy, fontWeight: 900 }}>👥 Gestão de Clientes (LGPD)</h2>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ background: COLORS.sand, borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.navy, marginBottom: 4 }}>🔒 Conformidade LGPD</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: COLORS.gray600, lineHeight: 2 }}>
                  <li>Dados coletados apenas com consentimento explícito</li>
                  <li>Direito de exclusão a qualquer momento</li>
                  <li>Promoções enviadas somente para clientes opt-in</li>
                  <li>Dados criptografados em repouso e em trânsito</li>
                  <li>DPO designado: privacidade@beachbar.com.br</li>
                </ul>
              </div>
            </Card>
            {[
              { name: "Maria Silva", email: "maria@email.com", visits: 12, status: "VIP", lastSeen: "Hoje" },
              { name: "João Pereira", email: "joao@email.com", visits: 3, status: "Regular", lastSeen: "3 dias" },
              { name: "Ana Rodrigues", email: "ana@email.com", visits: 7, status: "Frequente", lastSeen: "1 semana" },
            ].map(c => (
              <Card key={c.email} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.gray600 }}>{c.email}</div>
                    <div style={{ fontSize: 12, color: COLORS.gray400, marginTop: 4 }}>
                      {c.visits} visitas · última: {c.lastSeen}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge color={c.status === "VIP" ? COLORS.amber : c.status === "Frequente" ? COLORS.seaGlass : COLORS.gray200} textColor={c.status === "Regular" ? COLORS.gray800 : COLORS.navy}>
                      {c.status === "VIP" ? "⭐" : c.status === "Frequente" ? "🌟" : "👤"} {c.status}
                    </Badge>
                    <div style={{ marginTop: 8 }}>
                      <Button size="sm" variant="ghost" style={{ fontSize: 10, padding: "4px 10px" }}>Enviar promo</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}

        {activeSection === "settings" && (
          <>
            <h2 style={{ margin: "0 0 16px", fontSize: 20, color: COLORS.navy, fontWeight: 900 }}>⚙️ Configurações</h2>
            <Card style={{ marginBottom: 12 }}>
              <h3 style={{ margin: "0 0 16px", fontWeight: 800 }}>🏢 Multi-empresa</h3>
              {["BeachBar Copacabana", "BeachBar Ipanema", "BeachBar Búzios"].map((name, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 2 ? `1px solid ${COLORS.gray200}` : "none" }}>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Badge color={i === 0 ? COLORS.success : COLORS.gray200} textColor={i === 0 ? COLORS.white : COLORS.gray800}>
                      {i === 0 ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button size="sm" variant="ghost" style={{ fontSize: 10, padding: "4px 10px" }}>Gerenciar</Button>
                  </div>
                </div>
              ))}
              <Button variant="secondary" size="sm" style={{ marginTop: 16 }}>+ Adicionar empresa</Button>
            </Card>
            <Card style={{ marginBottom: 12 }}>
              <h3 style={{ margin: "0 0 16px", fontWeight: 800 }}>👤 Controle de Acesso</h3>
              {[
                { role: "Super Admin", desc: "Acesso total a todas as empresas", color: COLORS.coral },
                { role: "Admin", desc: "Gerencia uma unidade", color: COLORS.amber },
                { role: "Atendente", desc: "Gerencia pedidos", color: COLORS.seaGlass },
                { role: "Garçom", desc: "Entrega e atualizações", color: COLORS.navy },
                { role: "Cliente", desc: "Apenas faz pedidos", color: COLORS.gray400 },
              ].map(r => (
                <div key={r.role} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${COLORS.gray200}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flexShrink: 0 }}/>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{r.role}</div>
                    <div style={{ fontSize: 11, color: COLORS.gray600 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </Card>
            <Card>
              <h3 style={{ margin: "0 0 16px", fontWeight: 800 }}>🔒 Segurança & LGPD</h3>
              {[
                "✅ OAuth 2.0 (Google) ativo",
                "✅ Dados criptografados AES-256",
                "✅ Tokens JWT com expiração 24h",
                "✅ Logs de auditoria habilitados",
                "✅ Backup automático diário",
                "✅ Consentimento LGPD coletado",
              ].map((item, i) => (
                <div key={i} style={{ fontSize: 13, padding: "6px 0", color: COLORS.gray800 }}>{item}</div>
              ))}
            </Card>
          </>
        )}

        {activeSection === "menu" && (
          <>
            <h2 style={{ margin: "0 0 16px", fontSize: 20, color: COLORS.navy, fontWeight: 900 }}>🍽️ Gerenciar Cardápio</h2>
            {Object.entries(MOCK_MENU).map(([cat, items]) => (
              <Card key={cat} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontWeight: 800, textTransform: "capitalize" }}>{cat}</h3>
                  <Button size="sm" variant="secondary">+ Adicionar</Button>
                </div>
                {items.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${COLORS.gray200}` }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span>{item.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.gray600 }}>R$ {item.price.toFixed(2)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button size="sm" variant="ghost" style={{ fontSize: 10, padding: "4px 10px" }}>Editar</Button>
                    </div>
                  </div>
                ))}
              </Card>
            ))}
          </>
        )}

        {activeSection === "qrcodes" && (
          <>
            <h2 style={{ margin: "0 0 16px", fontSize: 20, color: COLORS.navy, fontWeight: 900 }}>🔲 QR Codes dos Guarda-sóis</h2>

            <Card style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: COLORS.gray600, lineHeight: 1.6 }}>
                Cada guarda-sol recebe um QR Code único. O cliente escaneia, é levado direto ao app já identificado pelo número da mesa, e faz o login com Google.
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>
                    Quantidade de guarda-sóis
                  </label>
                  <input
                    type="number" min="1" max="200" value={umbrellaCount}
                    onChange={e => setUmbrellaCount(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                    style={{
                      padding: "10px 12px", borderRadius: 8, border: `2px solid ${COLORS.gray200}`,
                      fontSize: 14, fontWeight: 700, width: 100, outline: "none", fontFamily: "inherit",
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>
                    URL base do app
                  </label>
                  <input
                    type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 8, boxSizing: "border-box",
                      border: `2px solid ${COLORS.gray200}`, fontSize: 13, outline: "none", fontFamily: "inherit", color: COLORS.gray800,
                    }}
                  />
                </div>
                <Button variant="primary" onClick={() => window.print()}>
                  🖨️ Imprimir todos
                </Button>
              </div>
            </Card>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 16,
            }}>
              {Array.from({ length: umbrellaCount }, (_, i) => i + 1).map(num => {
                const qrUrl = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}guardasol=${num}`;
                return (
                  <Card key={num} style={{ padding: 14, textAlign: "center" }}>
                    <QRCodeView value={qrUrl} size={120} />
                    <div style={{ marginTop: 10, fontWeight: 900, fontSize: 16, color: COLORS.navy }}>
                      ☂️ #{num.toString().padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: 9, color: COLORS.gray400, marginTop: 2, wordBreak: "break-all" }}>
                      {qrUrl.replace(/^https?:\/\//, "")}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── SETUP SCREEN (Super Admin Registration) ──────────────────────────────────
function SuperAdminSetup({ onComplete }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "" });
  const [done, setDone] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.company) return;
    setDone(true);
    setTimeout(() => onComplete({ ...form, role: "superadmin" }), 2000);
  };

  if (done) return (
    <div style={{
      minHeight: "100vh", background: COLORS.navy, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", color: COLORS.white, textAlign: "center", padding: 32,
    }}>
      <div style={{ fontSize: 80 }}>✅</div>
      <h2 style={{ fontSize: 28, fontWeight: 900, margin: "16px 0 8px" }}>Super Admin criado!</h2>
      <p style={{ opacity: 0.7 }}>Redirecionando para o painel...</p>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.navyLight})`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <Card style={{ maxWidth: 400, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>🏖️</div>
          <h2 style={{ margin: "8px 0 4px", fontWeight: 900, color: COLORS.navy, fontSize: 22 }}>Primeiro Acesso</h2>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.gray600 }}>Configure seu perfil de Super Administrador</p>
        </div>
        <div style={{ background: COLORS.sand, borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 12, color: COLORS.gray800, lineHeight: 1.6 }}>
          🔒 <strong>LGPD:</strong> Seus dados são armazenados com segurança e utilizados somente para gerenciar o sistema. Você pode solicitar exclusão a qualquer momento.
        </div>
        {[
          { key: "name", label: "Nome completo", placeholder: "Ex: João da Silva", type: "text" },
          { key: "email", label: "E-mail", placeholder: "joao@beachbar.com.br", type: "email" },
          { key: "company", label: "Nome da empresa", placeholder: "BeachBar Copacabana", type: "text" },
          { key: "phone", label: "Telefone (opcional)", placeholder: "(21) 99999-9999", type: "tel" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>
              {f.label}
            </label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10, boxSizing: "border-box",
                border: `2px solid ${COLORS.gray200}`, fontSize: 14, fontFamily: "inherit",
                outline: "none", color: COLORS.navy,
              }}
            />
          </div>
        ))}
        <Button
          variant="primary" size="lg"
          onClick={handleSubmit}
          disabled={!form.name || !form.email || !form.company}
          style={{ width: "100%", justifyContent: "center" }}
        >
          🚀 Criar conta Super Admin com Google
        </Button>
        <p style={{ textAlign: "center", fontSize: 10, color: COLORS.gray400, marginTop: 16 }}>
          Ao continuar, você concorda com nossa Política de Privacidade (LGPD) e Termos de Uso
        </p>
      </Card>
    </div>
  );
}

// ── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("setup"); // setup | login | app
  const [user, setUser] = useState(null);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Inter:wght@400;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    document.body.style.margin = "0";
    document.body.style.fontFamily = "Inter, sans-serif";
  }, []);

  if (screen === "setup") {
    return <SuperAdminSetup onComplete={(superAdmin) => {
      setUser(superAdmin);
      setScreen("app");
    }} />;
  }

  if (screen === "login" || !user) {
    return <LoginScreen onLogin={(u) => { setUser(u); setScreen("app"); }} />;
  }

  const handleLogout = () => { setUser(null); setScreen("login"); };

  if (user.role === "client") return <ClientApp user={user} onLogout={handleLogout} />;
  if (user.role === "waiter") return <WaiterApp user={user} onLogout={handleLogout} />;
  if (user.role === "admin" || user.role === "superadmin") return <AdminDashboard user={user} onLogout={handleLogout} />;

  return <LoginScreen onLogin={(u) => { setUser(u); setScreen("app"); }} />;
}
