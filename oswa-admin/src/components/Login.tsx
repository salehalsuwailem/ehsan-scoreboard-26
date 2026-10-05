import { useState } from "react";
import { supabase } from "../lib/supabase";

const logo = "/logo-mughamirun.png";
const oswaLogo = "/logo-oswa.png";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const sign = async () => {
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    setBusy(false);
  };

  const signup = async () => {
    setBusy(true);
    setMsg("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setMsg(error.message);
    else if (data.user) setMsg("تم إنشاء الحساب. إذا طُلب تأكيد البريد، أكّده ثم سجّل الدخول.");
    setBusy(false);
  };

  return (
    <div className="login">
      <div className="loginCard">
        <div className="motifs" aria-hidden="true">
          <span>🏀</span>
          <span>📖</span>
          <span>⚽</span>
          <span>⭐</span>
        </div>
        <img src={logo} alt="شعار المغامرون" />
        <h1>لوحة نقاط المغامرون</h1>
        <p>
          <img className="oswaBadge" src={oswaLogo} alt="" /> أُسوة · 2026
        </p>
        <input dir="ltr" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input dir="ltr" type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="loginBtns">
          <button className="primary" disabled={busy} onClick={sign}>
            دخول
          </button>
          <button disabled={busy} onClick={signup}>
            إنشاء حساب
          </button>
        </div>
        {msg && <div className="error">{msg}</div>}
      </div>
    </div>
  );
}
