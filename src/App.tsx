import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  User,
  CreditCard,
  Receipt,
  Loader2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Clock,
  Home,
  Sparkles,
  Image as ImageIcon,
  Copy,
  FileJson,
  Shield,
  Store,
  LogOut,
  KeyRound,
  HelpCircle,
  Server,
  Smartphone,
  Share,
  FileText,
  Trophy,
  CheckCircle2,
  Search,
  Moon,
  Sun,
  TrendingUp,
  AlertCircle,
  History,
  Gem,
  Crown,
  Award,
  Medal,
  ThumbsUp,
  Package,
  Heart,
  ClipboardList,
  XCircle,
  Users,
  Star,
  Wallet,
  Settings,
  Upload,
  Download,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  collection,
  getDoc,
  writeBatch,
} from "firebase/firestore";

// --- Utils ---
const getLocalDay = (d) => {
  if (!d || isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
};
const fmt = (n) =>
  new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(
    n || 0
  );
const calcTime = (s, e) => {
  if (!s || !e) return 0;
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  return (diff < 0 ? diff + 1440 : diff) / 60;
};

// Modified to use Monday start + Majority rule (ISO-8601 like for KR business weeks)
const getWeekOfMonth = (date) => {
  if (!date) return 1;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Nearest Thursday
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  // Relative to month
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
  monthStart.setDate(monthStart.getDate() + 4 - (monthStart.getDay() || 7));
  const monthStartWeekNo = Math.ceil(
    ((monthStart - yearStart) / 86400000 + 1) / 7
  );
  return weekNo - monthStartWeekNo + 1;
};

const dayNames = ["월", "화", "수", "목", "금", "토", "일"];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0")
);
const MINUTES = ["00", "10", "20", "30", "40", "50"];

const GREETINGS = [
  "오늘 하루도 수고 많으셨습니다. 사장님의 땀방울이 빛나는 내일을 만들 거예요. 🌟",
  "지친 하루 끝에 따뜻한 위로가 되길. 오늘도 자리를 지켜주셔서 감사합니다. ☕",
  "성공은 매일 반복되는 작은 노력들이 모여 만들어집니다. 응원해요! 💪",
  "가끔은 쉬어가도 괜찮아요. 사장님의 건강이 가게의 가장 큰 자산입니다. 🌿",
  "오늘도 가게를 밝혀주셔서 감사합니다. 좋은 일들만 가득하길! 😊",
  "비 온 뒤에 땅이 굳어지듯, 힘든 순간 뒤엔 더 큰 도약이 기다립니다. 🌈",
];

// --- Firebase Initialization ---
let config = {
  apiKey: "AIzaSyC-phuPCBIfqEgR7sbk_7JM5v_388rh-DY",
  authDomain: "code-makingg.firebaseapp.com",
  projectId: "code-makingg",
  storageBucket: "code-makingg.firebasestorage.app",
  messagingSenderId: "489485764766",
  appId: "1:489485764766:web:2654e0ce15efdac26b538f",
  measurementId: "G-KWXJNSS1M6",
};

if (typeof __firebase_config !== "undefined") {
  try {
    config = JSON.parse(__firebase_config);
  } catch (e) {
    console.warn("Using placeholder config");
  }
}

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// --- Script Loader ---
let html2canvasPromise = null;
const loadHtml2Canvas = () => {
  if (html2canvasPromise) return html2canvasPromise;
  html2canvasPromise = new Promise((resolve, reject) => {
    if (window.html2canvas) return resolve(window.html2canvas);
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.onload = () => resolve(window.html2canvas);
    script.onerror = () => {
      html2canvasPromise = null;
      reject(new Error("Failed to load html2canvas"));
    };
    document.body.appendChild(script);
  });
  return html2canvasPromise;
};

// --- Pie Chart Component ---
const SimplePieChart = ({ data, isDark }) => {
  let cumulativePercent = 0;
  const total = (data || []).reduce((acc, cur) => acc + cur.value, 0);
  if (total === 0)
    return (
      <div
        className={`text-center text-xs py-10 ${
          isDark ? "text-gray-500" : "text-gray-400"
        }`}
      >
        데이터 없음
      </div>
    );

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="flex items-center justify-center gap-6">
      <svg
        viewBox="-1 -1 2 2"
        className="w-28 h-28 transform -rotate-90 drop-shadow-lg"
      >
        {data.map((slice, i) => {
          const percent = slice.value / total;
          if (percent === 0) return null;
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += percent;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = percent > 0.5 ? 1 : 0;
          const pathData =
            percent === 1
              ? `M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0`
              : `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
          return (
            <path
              key={i}
              d={pathData}
              fill={slice.color}
              stroke={isDark ? "#1e293b" : "#ffffff"}
              strokeWidth="0.05"
            />
          );
        })}
      </svg>
      <div className="text-xs space-y-2">
        {data.map((slice, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: slice.color }}
            ></div>
            <span
              className={`${
                isDark ? "text-gray-300" : "text-gray-600"
              } font-medium`}
            >
              {slice.label}{" "}
              <span className="opacity-70">
                ({((slice.value / total) * 100).toFixed(0)}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Sales Trend Chart (Line Chart) ---
const SalesTrendChart = ({ data, labels, isDark }) => {
  const max = Math.max(...data, 1); // Prevent division by zero
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (val / max) * 80; // Leave top padding
      return `${x},${y}`;
    })
    .join(" ");

  const fillPath = `${points} 100,100 0,100`;

  return (
    // Adjusted height from h-40 to h-24 for better mobile UI/UX
    <div className="w-full h-24 flex items-end justify-center relative px-2 pt-2">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        <polygon points={fillPath} fill="url(#grad)" />

        {/* Thinner stroke for cleaner look */}
        <polyline
          points={points}
          fill="none"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((val, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - (val / max) * 80;
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="2.5"
                fill={isDark ? "#1e293b" : "#ffffff"}
                stroke="#6366f1"
                strokeWidth="1.5"
              />
              {/* Show value only if > 0, smaller text */}
              {val > 0 && (
                <text
                  x={x}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="7"
                  fill={isDark ? "#94a3b8" : "#64748b"}
                  fontWeight="bold"
                >
                  {(val / 10000).toFixed(0)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-0 w-full flex justify-between text-[9px] text-gray-400 font-bold px-2">
        {labels.map((l, i) => (
          <span key={i} className="w-4 text-center">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
};

// --- Sub Components ---

const DeleteBtn = ({ onClick, isDark }) => {
  const [confirm, setConfirm] = useState(false);
  if (confirm)
    return (
      <div className="flex gap-2 items-center animate-in slide-in-from-right-5 duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold hover:bg-red-600"
        >
          확인
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirm(false);
          }}
          className="text-gray-400"
        >
          <XCircle size={16} />
        </button>
      </div>
    );
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setConfirm(true);
      }}
      className={`${
        isDark
          ? "text-gray-500 hover:text-red-400"
          : "text-gray-300 hover:text-red-400"
      } p-1`}
    >
      <Trash2 size={14} />
    </button>
  );
};

const MemoBoard = ({ memo, onSave, isDark }) => {
  const [text, setText] = useState(memo || "");
  useEffect(() => {
    setText(memo || "");
  }, [memo]);
  return (
    <div
      className={`${
        isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"
      } p-5 rounded-3xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300`}
    >
      <div
        className={`absolute top-0 right-0 w-20 h-20 ${
          isDark ? "bg-yellow-900/20" : "bg-yellow-50"
        } rounded-bl-full -mr-10 -mt-10 transition-all`}
      ></div>
      <div
        className={`flex items-center gap-2 mb-3 font-bold text-sm relative z-10 ${
          isDark ? "text-yellow-400" : "text-gray-700"
        }`}
      >
        <div
          className={`${
            isDark
              ? "bg-yellow-900/30 text-yellow-400"
              : "bg-yellow-100 text-yellow-600"
          } p-2 rounded-xl`}
        >
          <ClipboardList size={18} />
        </div>
        매장 메모
      </div>
      <textarea
        className={`w-full p-4 rounded-2xl border-none text-sm h-28 resize-none focus:ring-2 transition-all leading-relaxed ${
          isDark
            ? "bg-slate-700 text-white placeholder-slate-400 focus:ring-yellow-500"
            : "bg-gray-50 text-gray-800 placeholder-gray-400 focus:ring-yellow-400 focus:bg-white"
        }`}
        placeholder="잊지 말아야 할 내용을 적어두세요..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onSave(text)}
      />
    </div>
  );
};

const AICoach = ({ stats, isDark }) => {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const generateAdvice = async () => {
    setLoading(true);
    const apiKey = "";
    try {
      const prompt = `역할:매장컨설턴트. 데이터:기간${stats.period},매출${fmt(
        stats.rev
      )},지출${fmt(stats.exp)},인건비${fmt(stats.pay)}(${
        stats.laborRate
      }%),부가세${fmt(stats.vat)},순이익${fmt(
        stats.netIncome
      )}. 요청:사장님께 도움될 구체적 조언 3가지를 아주 짧고 간결하게(반말x).`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const data = await response.json();
      setAdvice(
        data.candidates?.[0]?.content?.parts?.[0]?.text || "조언 생성 실패"
      );
    } catch (e) {
      setAdvice("AI 연결 실패");
    }
    setLoading(false);
  };
  return (
    <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-5 rounded-3xl shadow-lg text-white mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-xl">
            <Sparkles size={18} className="text-yellow-300" />
          </div>
          AI 매장 코치
        </h3>
        <button
          onClick={generateAdvice}
          disabled={loading}
          className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-white/20 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin w-3 h-3" /> : "조언 받기"}
        </button>
      </div>
      {advice ? (
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed relative z-10 border border-white/10 shadow-inner animate-in fade-in">
          {advice}
        </div>
      ) : (
        <p className="text-sm text-indigo-100 opacity-90 relative z-10 leading-relaxed">
          매장 데이터를 분석하여 매출 상승을 위한
          <br />
          맞춤형 조언을 받아보세요.
        </p>
      )}
    </div>
  );
};

// Fix 9: Increased font size
// Fix 1: Fixed "No Designation" adding issue
// Fix 2: Adjusted input widths
const VisitLogger = ({
  data,
  emps,
  inventory,
  onSave,
  onDelete,
  isDark,
  crmData,
}) => {
  const [inputs, setInputs] = useState({
    name: "",
    empId: "",
    item: "",
    price: "",
    qty: 1,
  });
  const [items, setItems] = useState([]);
  const [add, setAdd] = useState(false);
  const visits = data?.visits || [];
  const employees = emps || [];
  const menus = inventory || [];

  const handleItemChange = (val) => {
    const product = menus.find((p) => p.name === val);
    setInputs({
      ...inputs,
      item: val,
      price: product ? product.price : inputs.price,
    });
  };
  const addItem = () => {
    if (!inputs.item || !inputs.price) return;
    setItems([
      ...items,
      {
        name: inputs.item,
        price: parseInt(inputs.price),
        qty: parseInt(inputs.qty),
      },
    ]);
    setInputs({ ...inputs, item: "", price: "", qty: 1 });
  };
  const save = () => {
    if (!inputs.name || items.length === 0) return alert("입력 확인");
    // Ensure designatedEmpName is only set if empId exists
    const empName = inputs.empId
      ? employees.find((e) => e.id.toString() === inputs.empId)?.name
      : undefined;
    onSave(
      {
        ...data,
        visits: [
          ...visits,
          {
            id: Date.now(),
            customerName: inputs.name,
            designatedEmpId: inputs.empId || "",
            designatedEmpName: empName,
            items,
            totalAmount: items.reduce((s, i) => s + i.price * i.qty, 0),
          },
        ],
      },
      items
    );
    setInputs({ name: "", empId: "", item: "", price: "", qty: 1 });
    setItems([]);
    setAdd(false);
  };

  const cardBg = isDark
    ? "bg-slate-800 border-slate-700"
    : "bg-white border-gray-100";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3
          className={`font-bold flex items-center gap-2 ${
            isDark ? "text-slate-200" : "text-gray-800"
          }`}
        >
          <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
            <Users size={18} />
          </div>{" "}
          손님
        </h3>
        <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold shadow-sm">
          {fmt(visits.reduce((s, v) => s + v.totalAmount, 0))}
        </span>
      </div>

      {/* Input Card */}
      {add ? (
        <div
          className={`${cardBg} p-5 rounded-2xl shadow-sm border animate-in fade-in slide-in-from-top-2`}
        >
          <div className="flex gap-2 mb-3">
            <input
              placeholder="손님명"
              value={inputs.name}
              onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
              className={`flex-1 p-3 border-none rounded-xl text-base font-bold focus:ring-2 focus:ring-indigo-200 outline-none ${
                isDark ? "bg-slate-700 text-white" : "bg-gray-50 text-gray-800"
              }`}
            />
            <select
              value={inputs.empId}
              onChange={(e) => setInputs({ ...inputs, empId: e.target.value })}
              className={`flex-1 p-3 border-none rounded-xl text-base outline-none ${
                isDark ? "bg-slate-700 text-white" : "bg-gray-50 text-gray-800"
              }`}
            >
              <option value="">지명없음</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center mb-3">
            <input
              list="menuList"
              placeholder="메뉴"
              value={inputs.item}
              onChange={(e) => handleItemChange(e.target.value)}
              className={`flex-1 p-3 border-none rounded-xl text-base outline-none ${
                isDark ? "bg-slate-700 text-white" : "bg-gray-50 text-gray-800"
              }`}
            />
            <datalist id="menuList">
              {menus.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
            <input
              type="number"
              placeholder="가격"
              value={inputs.price}
              onChange={(e) => setInputs({ ...inputs, price: e.target.value })}
              className={`w-24 p-3 border-none rounded-xl text-base text-right outline-none ${
                isDark ? "bg-slate-700 text-white" : "bg-gray-50 text-gray-800"
              }`}
            />
            <input
              type="number"
              value={inputs.qty}
              onChange={(e) => setInputs({ ...inputs, qty: e.target.value })}
              className={`w-14 p-3 border-none rounded-xl text-base text-center outline-none ${
                isDark ? "bg-slate-700 text-white" : "bg-gray-50 text-gray-800"
              }`}
            />
            <button
              onClick={addItem}
              className="bg-indigo-100 text-indigo-600 px-3 py-3 rounded-xl text-xs font-bold hover:bg-indigo-200"
            >
              <Plus size={16} />
            </button>
          </div>
          {items.length > 0 && (
            <div
              className={`text-xs text-gray-500 mb-4 flex flex-wrap gap-1 p-2 rounded-xl ${
                isDark ? "bg-slate-700" : "bg-gray-50"
              }`}
            >
              {items.map((i, x) => (
                <span
                  key={x}
                  className={`px-2 py-1 rounded-lg border font-bold ${
                    isDark
                      ? "bg-slate-600 border-slate-500 text-indigo-300"
                      : "bg-white border-gray-200 text-indigo-600"
                  }`}
                >
                  {i.name}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={save}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95"
            >
              저장하기
            </button>
            <button
              onClick={() => setAdd(false)}
              className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                isDark
                  ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdd(true)}
          className={`w-full py-4 border-2 border-dashed rounded-2xl transition-all flex justify-center items-center gap-2 font-bold shadow-sm ${
            isDark
              ? "border-slate-700 text-slate-400 hover:border-indigo-400 hover:text-indigo-400 hover:bg-slate-800"
              : "border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50"
          }`}
        >
          <Plus size={20} /> 손님 추가하기
        </button>
      )}

      {/* Visit Cards List */}
      <div className="space-y-3">
        {visits.map((v) => (
          <div
            key={v.id}
            className={`${cardBg} p-4 rounded-2xl shadow-sm border flex justify-between items-start hover:shadow-md transition-shadow`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`font-black text-base ${
                    isDark ? "text-slate-200" : "text-gray-800"
                  }`}
                >
                  {v.customerName}
                </span>
                {v.designatedEmpName && (
                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                    <Star size={10} fill="currentColor" /> {v.designatedEmpName}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {fmt(v.totalAmount)}
              </div>
              <div className="flex flex-wrap gap-1">
                {v.items.map((i, x) => (
                  <span
                    key={x}
                    className={`px-2 py-1 rounded-lg text-[10px] border ${
                      isDark
                        ? "bg-slate-700 border-slate-600 text-slate-300"
                        : "bg-gray-50 border-gray-100 text-gray-600"
                    }`}
                  >
                    {i.name} x{i.qty}
                  </span>
                ))}
              </div>
            </div>
            <DeleteBtn
              onClick={() => onDelete(v.id, v.items)}
              isDark={isDark}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const ExpenseLogger = ({ data, onSave, isDark }) => {
  const [inputs, setInputs] = useState({ cat: "alcohol", desc: "", amt: "" });
  const [add, setAdd] = useState(false);
  const exps = data?.expenses || [];
  const cats = { alcohol: "술", food: "안주", supplies: "비품", other: "기타" };
  const save = () => {
    if (!inputs.amt) return;
    onSave({
      ...data,
      expenses: [
        ...exps,
        {
          id: Date.now(),
          category: inputs.cat,
          desc: inputs.desc,
          amount: parseInt(inputs.amt),
        },
      ],
    });
    setInputs({ cat: "alcohol", desc: "", amt: "" });
    setAdd(false);
  };

  const cardBg = isDark
    ? "bg-slate-800 border-slate-700"
    : "bg-white border-gray-100";

  return (
    <div className="space-y-4 mt-6">
      <div className="flex justify-between items-center px-1">
        <h3
          className={`font-bold flex items-center gap-2 ${
            isDark ? "text-slate-200" : "text-gray-800"
          }`}
        >
          <div className="bg-red-50 p-1.5 rounded-lg text-red-600">
            <Receipt size={18} />
          </div>{" "}
          지출
        </h3>
        <span className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded-full font-bold shadow-sm">
          {fmt(exps.reduce((s, e) => s + e.amount, 0))}
        </span>
      </div>

      {add ? (
        <div
          className={`${cardBg} p-5 rounded-2xl shadow-sm border animate-in fade-in slide-in-from-top-2`}
        >
          <div className="flex gap-2 mb-3">
            <select
              value={inputs.cat}
              onChange={(e) => setInputs({ ...inputs, cat: e.target.value })}
              className={`p-3 border-none rounded-xl text-sm outline-none ${
                isDark ? "bg-slate-700 text-white" : "bg-gray-50"
              }`}
            >
              <option value="alcohol">술(입고)</option>
              <option value="food">안주</option>
              <option value="supplies">비품</option>
              <option value="other">기타</option>
            </select>
            <input
              type="number"
              placeholder="금액"
              value={inputs.amt}
              onChange={(e) => setInputs({ ...inputs, amt: e.target.value })}
              className={`flex-1 p-3 border-none rounded-xl text-sm text-right outline-none ${
                isDark ? "bg-slate-700 text-white" : "bg-gray-50"
              }`}
            />
          </div>
          <div className="flex gap-2">
            <input
              placeholder="지출 내용"
              value={inputs.desc}
              onChange={(e) => setInputs({ ...inputs, desc: e.target.value })}
              className={`flex-1 p-3 border-none rounded-xl text-sm outline-none ${
                isDark ? "bg-slate-700 text-white" : "bg-gray-50"
              }`}
            />
            <button
              onClick={save}
              className="bg-red-500 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-red-600 shadow-md transition-all active:scale-95"
            >
              저장
            </button>
          </div>
          <button
            onClick={() => setAdd(false)}
            className="w-full mt-2 py-2 text-xs text-gray-400 font-bold hover:text-gray-600"
          >
            취소
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdd(true)}
          className={`w-full py-4 border-2 border-dashed rounded-2xl transition-all flex justify-center items-center gap-2 font-bold shadow-sm ${
            isDark
              ? "border-slate-700 text-slate-400 hover:border-red-400 hover:text-red-400 hover:bg-slate-800"
              : "border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
          }`}
        >
          <Plus size={20} /> 지출 추가하기
        </button>
      )}

      <div className="space-y-3">
        {exps.map((e) => (
          <div
            key={e.id}
            className={`${cardBg} p-4 rounded-2xl shadow-sm border flex justify-between items-center hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-[10px] px-2 py-1 rounded-lg text-white font-bold shadow-sm ${
                  e.category === "alcohol"
                    ? "bg-blue-400"
                    : e.category === "food"
                    ? "bg-orange-400"
                    : "bg-gray-400"
                }`}
              >
                {cats[e.category]}
              </span>
              <span
                className={`text-sm font-bold ${
                  isDark ? "text-slate-300" : "text-gray-700"
                }`}
              >
                {e.desc}
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <span
                className={`font-black text-sm ${
                  isDark ? "text-slate-200" : "text-gray-800"
                }`}
              >
                {fmt(e.amount)}
              </span>
              <DeleteBtn
                onClick={() =>
                  onSave({
                    ...data,
                    expenses: exps.filter((x) => x.id !== e.id),
                  })
                }
                isDark={isDark}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ScheduleManager = ({ emps, storeId, appId, isDark }) => {
  const [weekStart, setWeekStart] = useState(new Date());
  const [dailyShifts, setDailyShifts] = useState({});
  const [loading, setLoading] = useState(false);
  const tableRef = useRef(null);
  const [imgStatus, setImgStatus] = useState("idle");
  const [editCell, setEditCell] = useState(null);
  const [selHour, setSelHour] = useState("20");
  const [selMin, setSelMin] = useState("00");
  const [isCapturing, setIsCapturing] = useState(false);
  const safeEmps = emps || []; // Safety Guard

  useEffect(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    setWeekStart(new Date(d.setDate(diff)));
  }, []);

  useEffect(() => {
    if (!storeId || !db) return;
    const load = async () => {
      setLoading(true);
      const dateStr = getLocalDay(weekStart);
      try {
        const ref = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "stores",
          `${storeId}_schedule_${dateStr}`
        );
        const snap = await getDoc(ref);
        if (snap.exists()) setDailyShifts(snap.data().shifts || {});
        else setDailyShifts({});
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [weekStart, storeId]);

  const saveToDb = async (shifts) => {
    const dateStr = getLocalDay(weekStart);
    try {
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "stores",
          `${storeId}_schedule_${dateStr}`
        ),
        { shifts }
      );
    } catch (e) {
      console.error("Auto-save failed", e);
    }
  };

  const updateSlot = (dayIdx, slotIdx, field, value) => {
    const newShifts = { ...dailyShifts };
    if (!newShifts[dayIdx]) newShifts[dayIdx] = [{}, {}, {}, {}];
    if (!newShifts[dayIdx][slotIdx]) newShifts[dayIdx][slotIdx] = {};
    newShifts[dayIdx][slotIdx][field] = value;

    if (field === "empId" && value && !newShifts[dayIdx][slotIdx].time) {
      const defaultTimes = ["20:00", "21:00", "22:00", "22:00"];
      newShifts[dayIdx][slotIdx].time = defaultTimes[slotIdx] || "20:00";
    }

    setDailyShifts(newShifts);
    saveToDb(newShifts);
  };

  const openTimePicker = (dayIdx, slotIdx, currentTime) => {
    setEditCell({ dayIdx, slotIdx });
    if (currentTime) {
      const [h, m] = currentTime.split(":");
      setSelHour(h || "20");
      setSelMin(m || "00");
    } else {
      const defaultTimes = ["20", "21", "22", "22"];
      setSelHour(defaultTimes[slotIdx] || "20");
      setSelMin("00");
    }
  };

  const saveTime = () => {
    if (editCell) {
      updateSlot(
        editCell.dayIdx,
        editCell.slotIdx,
        "time",
        `${selHour}:${selMin}`
      );
      setEditCell(null);
    }
  };

  const deleteTime = () => {
    if (editCell) {
      updateSlot(editCell.dayIdx, editCell.slotIdx, "time", "");
      setEditCell(null);
    }
  };

  const saveAsImage = async () => {
    setImgStatus("loading");
    setIsCapturing(true);
    setTimeout(async () => {
      try {
        const html2canvas = await loadHtml2Canvas();
        // Fix 4: Added backgroundColor to html2canvas options
        const canvas = await html2canvas(tableRef.current, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
        });
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `스케줄표_${getLocalDay(weekStart)}.png`;
        link.click();
        setImgStatus("done");
      } catch (e) {
        console.error(e);
        setImgStatus("error");
        alert("이미지 생성 실패.");
      } finally {
        setIsCapturing(false);
        setTimeout(() => setImgStatus("idle"), 2000);
      }
    }, 300);
  };

  const cardBg = isDark
    ? "bg-slate-800 border-slate-700"
    : "bg-white border-gray-100";

  return (
    <div className={`${cardBg} p-5 rounded-2xl shadow-sm border space-y-4`}>
      <div
        className={`flex justify-between items-center p-3 rounded-xl border ${
          isDark
            ? "bg-slate-700 border-slate-600"
            : "bg-gray-50 border-gray-100"
        }`}
      >
        <div className="flex-1 flex items-center gap-3">
          <span
            className={`text-sm font-bold whitespace-nowrap flex items-center gap-1 ${
              isDark ? "text-slate-300" : "text-gray-600"
            }`}
          >
            <CalendarIcon size={16} /> 주간 선택:
          </span>
          <input
            type="date"
            value={getLocalDay(weekStart)}
            onChange={(e) => {
              const d = new Date(e.target.value);
              const day = d.getDay();
              const diff = d.getDate() - day + (day === 0 ? -6 : 1);
              setWeekStart(new Date(d.setDate(diff)));
            }}
            className={`border rounded-lg p-1.5 text-sm font-bold outline-none ${
              isDark
                ? "bg-slate-600 border-slate-500 text-white"
                : "bg-white border-gray-200"
            }`}
          />
        </div>
        <button
          onClick={saveAsImage}
          className={`p-2.5 border rounded-xl hover:bg-blue-50 transition-all ${
            isDark ? "border-slate-600 hover:bg-slate-600" : "border-gray-200"
          } ${imgStatus === "loading" ? "opacity-50" : ""}`}
          title="이미지 다운로드"
        >
          {imgStatus === "loading" ? (
            <Loader2 size={20} className="animate-spin text-blue-500" />
          ) : (
            <ImageIcon size={20} className="text-blue-500" />
          )}
        </button>
      </div>

      <div className="overflow-x-auto pb-2">
        {/* Fix 4: Added bg-white explicitly for capture */}
        <div
          className={`min-w-[500px] p-6 rounded-xl border shadow-sm ${
            isDark
              ? "bg-slate-800 border-slate-600 text-white"
              : "bg-white border-gray-200"
          }`}
          ref={tableRef}
        >
          <div
            className={`font-bold text-center mb-6 text-xl border-b-2 pb-3 tracking-tight ${
              isDark ? "border-slate-600" : "border-gray-800"
            }`}
          >
            {weekStart.getMonth() + 1}월 {getWeekOfMonth(weekStart)}주차 근무표
          </div>
          <div
            className={`grid grid-cols-1 divide-y border-b ${
              isDark
                ? "divide-slate-700 border-slate-700"
                : "divide-gray-100 border-gray-200"
            }`}
          >
            <div
              className={`grid grid-cols-5 font-bold text-sm py-3 text-center rounded-t-lg ${
                isDark
                  ? "bg-slate-700 text-slate-300"
                  : "bg-gray-50 text-gray-600"
              }`}
            >
              <div
                className={`col-span-1 border-r ${
                  isDark ? "border-slate-600" : "border-gray-200"
                }`}
              >
                요일
              </div>
              <div className="col-span-1">근무자 1</div>
              <div className="col-span-1">근무자 2</div>
              <div className="col-span-1">근무자 3</div>
              <div className="col-span-1">근무자 4</div>
            </div>
            {dayNames.map((d, dayIdx) => (
              <div
                key={dayIdx}
                className={`grid grid-cols-5 text-sm py-3.5 items-center transition-colors ${
                  isDark ? "hover:bg-slate-700/50" : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`col-span-1 font-bold text-center border-r ${
                    isDark ? "border-slate-700" : "border-gray-200"
                  } ${
                    d === "일"
                      ? "text-red-500"
                      : d === "토"
                      ? "text-blue-500"
                      : isDark
                      ? "text-slate-300"
                      : "text-gray-700"
                  }`}
                >
                  {d}요일
                </div>
                {[0, 1, 2, 3].map((slotIdx) => {
                  const slot = dailyShifts[dayIdx]?.[slotIdx] || {};
                  const emp = safeEmps.find((e) => e.id == slot.empId);
                  return (
                    <div
                      key={slotIdx}
                      className="col-span-1 px-2 flex flex-col gap-1 items-center"
                    >
                      {isCapturing ? (
                        <div
                          className={`text-sm font-bold h-6 ${
                            isDark ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {emp ? emp.name : "-"}
                        </div>
                      ) : (
                        <select
                          className={`border rounded-md text-[11px] p-1 w-full mb-1 outline-none ${
                            isDark
                              ? "bg-slate-700 border-slate-600 text-white"
                              : "bg-white border-gray-200 focus:border-blue-400"
                          }`}
                          value={slot.empId || ""}
                          onChange={(e) =>
                            updateSlot(dayIdx, slotIdx, "empId", e.target.value)
                          }
                        >
                          <option value="">-</option>
                          {safeEmps.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <div
                        onClick={() =>
                          !isCapturing &&
                          openTimePicker(dayIdx, slotIdx, slot.time)
                        }
                        className={`text-xs font-medium ${
                          slot.time
                            ? "text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full"
                            : "text-gray-300"
                        } ${
                          !isCapturing &&
                          "cursor-pointer hover:scale-105 transition-transform"
                        }`}
                      >
                        {slot.time || "00:00"}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {isCapturing && (
            <div className="text-right text-[10px] text-gray-400 mt-3 font-medium">
              매장 관리자 Pro
            </div>
          )}
        </div>
      </div>

      {editCell && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setEditCell(null)}
        >
          <div
            className={`p-6 rounded-2xl shadow-2xl w-72 animate-in zoom-in-95 ${
              isDark ? "bg-slate-800" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className={`font-bold text-center mb-6 text-lg ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              출근 시간 선택
            </h3>
            <div
              className={`flex gap-3 mb-8 justify-center items-center p-4 rounded-xl ${
                isDark ? "bg-slate-700" : "bg-gray-50"
              }`}
            >
              <div className="flex flex-col items-center">
                <select
                  value={selHour}
                  onChange={(e) => setSelHour(e.target.value)}
                  className={`text-2xl font-bold p-2 border-none bg-transparent outline-none ${
                    isDark ? "text-white" : "text-gray-800"
                  }`}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-400 font-bold">시</span>
              </div>
              <span className="text-2xl font-bold text-gray-300 pb-4">:</span>
              <div className="flex flex-col items-center">
                <select
                  value={selMin}
                  onChange={(e) => setSelMin(e.target.value)}
                  className={`text-2xl font-bold p-2 border-none bg-transparent outline-none ${
                    isDark ? "text-white" : "text-gray-800"
                  }`}
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-400 font-bold">분</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveTime}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all"
              >
                확인
              </button>
              <button
                onClick={deleteTime}
                className={`flex-1 border py-3 rounded-xl font-bold transition-all ${
                  isDark
                    ? "bg-slate-700 border-slate-600 text-red-400"
                    : "bg-white border-red-200 text-red-500 hover:bg-red-50"
                }`}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// StoreAuth 컴포넌트 전체 교체
const StoreAuth = ({ onLogin, user }) => {
  const [mode, setMode] = useState("login");
  const [storeId, setStoreId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // 화면이 뜰 때 저장된 정보가 있으면 불러오기 (자동 채움)
  useEffect(() => {
    const savedId = localStorage.getItem("saved_store_id");
    const savedPw = localStorage.getItem("saved_password");

    if (savedId) {
      setStoreId(savedId);
      setRememberMe(true); // 아이디가 있으면 자동 로그인 체크박스 켜기
    }
    if (savedPw) {
      try {
        setPassword(atob(savedPw));
      } catch (e) {
        console.error("비밀번호 복호화 실패:", e);
      }
    }
  }, []);

  const handleAction = async () => {
    const formattedStoreId = storeId.toUpperCase().trim();
    if (!formattedStoreId || !password)
      return setError("매장 코드와 비밀번호를 입력하세요.");
    if (password.length < 4)
      return setError("비밀번호는 4자리 이상이어야 합니다.");
    if (!user) return setError("서버 연결 대기중...");

    setLoading(true);
    setError("");

    try {
      const credRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "stores",
        formattedStoreId
      );
      const snap = await getDoc(credRef);

      if (mode === "register") {
        if (snap.exists()) setError("이미 존재하는 매장 코드입니다.");
        else {
          await setDoc(credRef, {
            password: password,
            created: new Date().toISOString(),
          });
          alert(
            `매장 [${formattedStoreId}]가 생성되었습니다!\n비밀번호를 잊지 마세요.`
          );
          onLogin(formattedStoreId, rememberMe, password);
        }
      } else {
        if (!snap.exists()) setError("존재하지 않는 매장 코드입니다.");
        else {
          const data = snap.data();
          if (data.password === password) {
            onLogin(formattedStoreId, rememberMe, password);
          } else {
            setError("비밀번호가 일치하지 않습니다.");
          }
        }
      }
    } catch (e) {
      console.error(e);
      setError("오류가 발생했습니다: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-500 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100">
            <Store className="text-indigo-600" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">
            {mode === "login" ? "매장 입장" : "매장 생성"}
          </h1>
          <p className="text-slate-500 text-sm">
            {mode === "login"
              ? "매장 코드와 비밀번호를 입력하세요."
              : "나만의 매장 관리 시스템을 시작해보세요."}
          </p>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              매장 코드
            </label>
            <div className="relative group">
              <Store
                className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                value={storeId}
                onChange={(e) =>
                  setStoreId(
                    e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase()
                  )
                }
                className="w-full pl-12 p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all uppercase font-bold text-slate-700"
                placeholder="STORE_ID"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              비밀번호
            </label>
            <div className="relative group">
              <KeyRound
                className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                size={18}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-bold text-slate-700"
                placeholder="••••••"
              />
            </div>
          </div>
          {mode === "login" && (
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-slate-600 cursor-pointer"
              >
                로그인 정보 기억하기 (자동 로그인)
              </label>
            </div>
          )}
          {error && (
            <div className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100 whitespace-pre-wrap animate-in shake">
              {error}
            </div>
          )}
          <button
            onClick={handleAction}
            disabled={loading || !user}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : mode === "login" ? (
              "입장하기"
            ) : (
              "시작하기"
            )}
          </button>
        </div>
        <div className="flex justify-center mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="text-sm text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
          >
            {mode === "login"
              ? "아직 계정이 없으신가요? 매장 만들기"
              : "이미 계정이 있으신가요? 로그인"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Fix 6: Sub-component for inventory item to prevent re-render issues
const InventoryItem = ({ item, idx, isDark, onUpdate, onDelete }) => {
  const [localStock, setLocalStock] = useState(item.stock);

  // Update local state when props change (e.g. refresh)
  useEffect(() => {
    setLocalStock(item.stock);
  }, [item.stock]);

  return (
    <div
      className={`${
        isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"
      } p-4 rounded-2xl shadow-sm border relative group`}
    >
      <div className="flex gap-3 items-center mb-3">
        <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
          <Package size={20} />
        </div>
        <input
          className="font-bold text-lg bg-transparent border-b border-transparent focus:border-emerald-300 focus:outline-none w-full"
          placeholder="품명 입력"
          value={item.name}
          onChange={(e) => onUpdate(idx, "name", e.target.value)}
        />
        {parseInt(item.stock) < 5 && (
          <AlertCircle size={16} className="text-red-500 animate-pulse" />
        )}
        <button
          onClick={() => onDelete(idx)}
          className="opacity-30 hover:opacity-100 hover:text-red-500 p-1"
        >
          <XCircle size={20} />
        </button>
      </div>
      <div className="flex gap-2">
        <div
          className={`flex-1 p-2 rounded-xl border ${
            isDark
              ? "bg-slate-700 border-slate-600"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          <label className="text-[10px] opacity-50 block mb-1">가격</label>
          <input
            className="w-full bg-transparent font-bold text-right outline-none"
            type="number"
            placeholder="0"
            value={item.price}
            onChange={(e) => onUpdate(idx, "price", e.target.value)}
          />
        </div>
        <div
          className={`flex-1 p-2 rounded-xl border ${
            isDark
              ? "bg-slate-700 border-slate-600"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          <label className="text-[10px] opacity-50 block mb-1">재고 수량</label>
          <input
            className="w-full bg-transparent font-bold text-center text-indigo-600 outline-none"
            type="number"
            placeholder="0"
            value={localStock}
            onChange={(e) => setLocalStock(e.target.value)}
            onBlur={(e) => onUpdate(idx, "stock", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [storeId, setStoreId] = useState(null); // Initialize as null
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoginCheckLoading, setIsLoginCheckLoading] = useState(true); // New state for auto-login check

  const [tab, setTab] = useState("home");
  const [date, setDate] = useState(getLocalDay(new Date()));
  const [rMode, setRMode] = useState("weekly");
  const [rDate, setRDate] = useState(getLocalDay(new Date()));
  const [appSettings, setAppSettings] = useState({
    appTitle: "매장 관리자",
    employees: [],
    memo: "",
    inventory: [],
    customerMemos: {},
    fixedCosts: [],
    isDark: false,
    inventoryLogs: [],
  });
  const [records, setRecords] = useState({});
  const [status, setStatus] = useState("");
  const [editTitle, setEditTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [selectedEmp, setSelectedEmp] = useState("");
  const [backupText, setBackupText] = useState("");
  const [restoreText, setRestoreText] = useState("");
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  const [crmPage, setCrmPage] = useState(1);
  const [fcInput, setFcInput] = useState({ name: "", amount: "" });
  const [payslipWeek, setPayslipWeek] = useState(new Date());
  const [randomGreeting, setRandomGreeting] = useState(GREETINGS[0]);

  const [crmSearch, setCrmSearch] = useState("");

  const fileInputRef = useRef(null);

  const isDark = appSettings.isDark || false;
  const bgMain = isDark ? "bg-slate-900" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-gray-800";
  const cardBg = isDark
    ? "bg-slate-800 border-slate-700"
    : "bg-white border-gray-100";
  const inputClass = isDark
    ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
    : "bg-white border-gray-200 text-gray-800 placeholder-gray-400";
  const cardClass = cardBg;

  useEffect(() => {
    setRandomGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  }, []);

  useEffect(() => {
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "/manifest.json";
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[rel="icon"]')) {
      const icon = document.createElement("link");
      icon.rel = "icon";
      icon.href = "https://cdn-icons-png.flaticon.com/512/869/869636.png";
      document.head.appendChild(icon);
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .catch((err) => console.log("SW 등록 실패:", err));
    }
  }, []);
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth Init Failed:", e);
      }
    };
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (isMounted) {
        setUser(u);
        setIsAuthReady(true);
      }
    });
    initAuth();
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  // Improved Auto-Login Logic in App
  // App 컴포넌트 내부의 자동 로그인 useEffect 교체
  useEffect(() => {
    const checkAutoLogin = async () => {
      // Firebase 인증이 아직 준비되지 않았으면 대기
      if (!isAuthReady) return;

      const savedId = localStorage.getItem("saved_store_id");
      const savedPw = localStorage.getItem("saved_password");

      // 저장된 정보가 있다면 검증 시도
      if (user && savedId && savedPw) {
        try {
          const credRef = doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "stores",
            savedId.toUpperCase().trim()
          );
          const snap = await getDoc(credRef);

          // 매장이 존재하고 비밀번호가 일치할 때만 로그인 처리
          if (snap.exists() && snap.data().password === atob(savedPw)) {
            setStoreId(savedId);
          } else {
            // 검증 실패(비번 변경 등)하더라도 입력창에 아이디/비번이 남아있도록 스토리지를 비우지 않음
            console.warn("자동 로그인 실패: 정보 불일치");
          }
        } catch (e) {
          console.error("자동 로그인 검증 중 오류:", e);
          // 네트워크 오류 등으로 실패해도 스토리지는 유지
        }
      }
      // 검증이 끝나면 로딩 화면 끄기
      setIsLoginCheckLoading(false);
    };

    checkAutoLogin();
  }, [isAuthReady, user, appId, db]); // 의존성 배열 수정

  useEffect(() => {
    if (!storeId || !user) return;
    const settingsRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "stores",
      `${storeId}_settings`
    );
    const recordsCollection = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "stores"
    );
    const unsubS = onSnapshot(
      settingsRef,
      (s) => {
        if (s.exists()) {
          const d = s.data();
          if (typeof d.fixedCost === "number") {
            d.fixedCosts =
              d.fixedCost > 0
                ? [{ id: Date.now(), name: "기타 고정비", amount: d.fixedCost }]
                : [];
            delete d.fixedCost;
          }
          if (d.darkMode !== undefined && d.isDark === undefined)
            d.isDark = d.darkMode;
          // Ensure defaults
          setAppSettings({
            ...d,
            employees: d.employees || [],
            inventory: d.inventory || [],
            fixedCosts: d.fixedCosts || [],
          });
        } else
          setDoc(settingsRef, {
            appTitle: "우리 매장",
            employees: [],
            memo: "",
            inventory: [],
            customerMemos: {},
            fixedCosts: [],
            isDark: false,
            inventoryLogs: [],
          });
      },
      (err) => console.error("Settings Sync Err:", err)
    );
    const unsubR = onSnapshot(
      recordsCollection,
      (s) => {
        const r = {};
        s.forEach((d) => {
          if (d.id.startsWith(`${storeId}_record_`)) {
            const dateKey = d.id.replace(`${storeId}_record_`, "");
            r[dateKey] = d.data();
          }
        });
        setRecords(r);
      },
      (err) => console.error("Records Sync Err:", err)
    );
    return () => {
      unsubS();
      unsubR();
    };
  }, [storeId, user]);

  const saveRec = async (d, data) => {
    setRecords((p) => ({ ...p, [d]: data }));
    setStatus("저장..");
    try {
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "stores",
          `${storeId}_record_${d}`
        ),
        data
      );
      setStatus("✓");
      setTimeout(() => setStatus(""), 1000);
    } catch (e) {
      setStatus("Err");
    }
  };
  const saveSet = async (s) => {
    setAppSettings(s);
    await setDoc(
      doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "stores",
        `${storeId}_settings`
      ),
      s
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("saved_store_id");
    localStorage.removeItem("saved_password");
    setStoreId(null);
    setLogoutConfirm(false);
  };

  const handleVisitSave = async (newData, consumedItems) => {
    await saveRec(date, newData);
    if (consumedItems && consumedItems.length > 0) {
      const newInventory = appSettings.inventory.map((invItem) => {
        const consumed = consumedItems.find((i) => i.name === invItem.name);
        return consumed
          ? { ...invItem, stock: parseInt(invItem.stock) - consumed.qty }
          : invItem;
      });
      saveSet({ ...appSettings, inventory: newInventory });
    }
  };
  const handleVisitDelete = async (visitId, itemsToRestore) => {
    const curRecord = records[date] || { visits: [] };
    const newVisits = curRecord.visits.filter((v) => v.id !== visitId);
    const newRecord = { ...curRecord, visits: newVisits };
    await saveRec(date, newRecord);
    if (itemsToRestore && itemsToRestore.length > 0) {
      const newInventory = appSettings.inventory.map((invItem) => {
        const restored = itemsToRestore.find((i) => i.name === invItem.name);
        return restored
          ? { ...invItem, stock: parseInt(invItem.stock) + restored.qty }
          : invItem;
      });
      saveSet({ ...appSettings, inventory: newInventory });
    }
  };

  const getBackupData = () =>
    JSON.stringify(
      { settings: appSettings, records, backupDate: new Date().toISOString() },
      null,
      2
    );
  const handleFileBackup = () => {
    try {
      const blob = new Blob([getBackupData()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `store_backup_${getLocalDay(new Date())}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("파일 다운로드가 차단되었습니다.");
    }
  };
  const handleClipboardBackup = () => {
    const data = getBackupData();
    setBackupText(data);
    navigator.clipboard
      .writeText(data)
      .then(() => alert("복사 완료!"))
      .catch(() => alert("복사 실패"));
  };
  const handleFileRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => processRestore(event.target.result);
    reader.readAsText(file);
  };
  const processRestore = async (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.settings || !data.records) throw new Error("형식 오류");
      if (!confirm("데이터를 덮어쓰시겠습니까?")) return;
      setStatus("복원중...");
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "stores",
          `${storeId}_settings`
        ),
        data.settings
      );
      const batch = writeBatch(db);
      let count = 0;
      for (const [key, val] of Object.entries(data.records)) {
        batch.set(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "stores",
            `${storeId}_record_${key}`
          ),
          val
        );
        if (++count >= 400) {
          await batch.commit();
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
      setStatus("완료");
      setTimeout(() => setStatus(""), 2000);
      alert("복원 완료!");
      window.location.reload();
    } catch (err) {
      alert("복원 실패: " + err.message);
    }
  };

  const calculateStats = (baseDate, mode) => {
    const t = new Date(baseDate);
    const start =
      mode === "weekly"
        ? new Date(
            t.setDate(t.getDate() - t.getDay() + (t.getDay() === 0 ? -6 : 1))
          )
        : new Date(t.getFullYear(), t.getMonth(), 1);
    const end =
      mode === "weekly"
        ? new Date(start.getTime() + 6 * 86400000)
        : new Date(t.getFullYear(), t.getMonth() + 1, 0);

    let s = {
      rev: 0,
      exp: 0,
      pay: 0,
      big: 0,
      small: 0,
      items: {},
      des: {},
      emps: {},
      days: [0, 0, 0, 0, 0, 0, 0],
      weekTotals: {},
      transportTotal: 0,
      pureLabor: 0,
      catExp: {},
    };
    (appSettings.employees || []).forEach(
      (e) =>
        (s.emps[e.id] = {
          name: e.name,
          pay: 0,
          inc: 0,
          transportPay: 0,
          hours: 0,
          workDays: new Set(),
          useTax: e.useTax,
          trCount: 0,
        })
    );

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = getLocalDay(d);
      const r = records[dateStr];
      const dailyTotal = r
        ? (r.genCash || 0) +
          (r.genBig || 0) +
          (r.genSmall || 0) +
          Object.values(r.empData || {}).reduce(
            (a, v) =>
              a +
              (parseInt(v.cash) || 0) +
              (parseInt(v.big) || 0) +
              (parseInt(v.small) || 0),
            0
          )
        : 0;

      const sundayDate = new Date(d);
      sundayDate.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? 0 : 7));
      const sundayStr = getLocalDay(sundayDate);
      s.weekTotals[sundayStr] = (s.weekTotals[sundayStr] || 0) + dailyTotal;

      if (!r) continue;
      const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      s.days[dayIdx] += dailyTotal;
      const big = r.genBig || 0,
        small = r.genSmall || 0;
      s.rev += dailyTotal;
      s.big += big;
      s.small += small;

      Object.entries(r.empData || {}).forEach(([id, v]) => {
        const e = (appSettings.employees || []).find(
          (x) => x.id.toString() === id
        );
        if (e) {
          const subBig = parseInt(v.big) || 0,
            subSmall = parseInt(v.small) || 0;
          s.big += subBig;
          s.small += subSmall;
          const hrs = calcTime(v.start, v.end);
          const inc =
            (parseInt(v.cash) || 0) * (e.incentiveRate / 100) +
            (subBig + subSmall) * (e.incentiveRate / 100) * 0.9;
          if (v.des) s.des[id] = (s.des[id] || 0) + 1;
          if (s.emps[id]) {
            s.emps[id].pay += hrs * e.hourlyRate;
            s.emps[id].inc += inc;
            if (v.tr) {
              s.emps[id].transportPay += e.transportFee || 0;
              s.emps[id].trCount++;
            }
            s.emps[id].hours += hrs;
            if (hrs > 0) s.emps[id].workDays.add(d.getDay());
          }
        }
      });
      (r.expenses || []).forEach((e) => {
        s.exp += e.amount;
        s.catExp[e.category] = (s.catExp[e.category] || 0) + e.amount;
      });
      (r.visits || []).forEach((v) => {
        if (v.designatedEmpId)
          s.des[v.designatedEmpId] = (s.des[v.designatedEmpId] || 0) + 1;
        v.items.forEach((i) => {
          s.items[i.name] = s.items[i.name] || { qty: 0, amt: 0 };
          s.items[i.name].qty += i.qty;
          s.items[i.name].amt += i.price * i.qty;
        });
      });
    }

    Object.values(s.emps).forEach((e) => {
      s.pureLabor += e.pay + e.inc;
      s.transportTotal += e.transportPay;
      s.pay += e.pay + e.inc + e.transportPay;
    });
    const fixedTotal =
      mode === "monthly"
        ? (appSettings.fixedCosts || []).reduce(
            (sum, item) => sum + parseInt(item.amount),
            0
          )
        : 0;
    const netIncome = s.rev - s.exp - s.pay - s.rev * 0.1 - fixedTotal;
    const payDate = new Date(start);
    payDate.setDate(payDate.getDate() + 6);

    return {
      ...s,
      vat: s.big * 0.1,
      real: s.rev - s.small * 0.055,
      period: `${start.getMonth() + 1}/${start.getDate()}~${
        end.getMonth() + 1
      }/${end.getDate()}`,
      payDateStr: `${payDate.getFullYear()}.${
        payDate.getMonth() + 1
      }.${payDate.getDate()}`,
      bigRate: s.rev > 0 ? ((s.big / s.rev) * 100).toFixed(1) : 0,
      smallRate: s.rev > 0 ? ((s.small / s.rev) * 100).toFixed(1) : 0,
      fixed: fixedTotal,
      netIncome,
      laborRate: s.rev > 0 ? ((s.pay / s.rev) * 100).toFixed(1) : 0,
      pieData: [
        { label: "술", value: s.catExp["alcohol"] || 0, color: "#60A5FA" },
        { label: "안주", value: s.catExp["food"] || 0, color: "#FBBF24" },
        { label: "비품", value: s.catExp["supplies"] || 0, color: "#34D399" },
        { label: "기타", value: s.catExp["other"] || 0, color: "#A78BFA" },
      ].filter((d) => d.value > 0),
    };
  };

  const stats = useMemo(
    () => calculateStats(rDate, rMode),
    [records, appSettings, rMode, rDate]
  );
  const payslipStats = useMemo(
    () => calculateStats(payslipWeek, "weekly"),
    [records, appSettings, payslipWeek]
  );

  const crmData = useMemo(() => {
    const customers = {};
    Object.entries(records).forEach(([d, r]) => {
      (r.visits || []).forEach((v) => {
        if (!customers[v.customerName])
          customers[v.customerName] = {
            name: v.customerName,
            visits: 0,
            spent: 0,
            lastVisit: "",
            menuCounts: {},
          };
        customers[v.customerName].visits += 1;
        customers[v.customerName].spent += v.totalAmount;
        if (d > customers[v.customerName].lastVisit)
          customers[v.customerName].lastVisit = d;
        v.items.forEach((i) => {
          customers[v.customerName].menuCounts[i.name] =
            (customers[v.customerName].menuCounts[i.name] || 0) + i.qty;
        });
      });
    });

    const list = Object.values(customers).map((c) => {
      const favMenu =
        Object.entries(c.menuCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "없음";
      return { ...c, favMenu };
    });

    return list
      .sort((a, b) => b.spent - a.spent)
      .filter((c) => c.name.includes(crmSearch));
  }, [records, crmSearch]);

  const getRankBadge = (rank, total, metric) => {
    const percentile = ((rank + 1) / total) * 100;
    if (metric === "spent") {
      if (percentile <= 5)
        return {
          icon: (
            <Crown size={14} className="text-yellow-500" fill="currentColor" />
          ),
          label: "VIP",
          color: "bg-yellow-100 text-yellow-600",
        };
      if (percentile <= 10)
        return {
          icon: (
            <Medal size={14} className="text-yellow-400" fill="currentColor" />
          ),
          label: "Gold",
          color: "bg-yellow-50 text-yellow-500",
        };
      if (percentile <= 20)
        return {
          icon: (
            <Medal size={14} className="text-slate-400" fill="currentColor" />
          ),
          label: "Silver",
          color: "bg-slate-100 text-slate-500",
        };
      if (percentile <= 30)
        return {
          icon: (
            <Medal size={14} className="text-orange-400" fill="currentColor" />
          ),
          label: "Bronze",
          color: "bg-orange-50 text-orange-500",
        };
    } else {
      if (percentile <= 5)
        return {
          icon: <Gem size={14} className="text-blue-500" fill="currentColor" />,
          label: "Diamond",
          color: "bg-blue-100 text-blue-600",
        };
      if (percentile <= 10)
        return {
          icon: (
            <Star size={14} className="text-yellow-400" fill="currentColor" />
          ),
          label: "Star",
          color: "bg-yellow-50 text-yellow-500",
        };
      if (percentile <= 20)
        return {
          icon: (
            <Sparkles
              size={14}
              className="text-purple-400"
              fill="currentColor"
            />
          ),
          label: "Spark",
          color: "bg-purple-50 text-purple-500",
        };
      if (percentile <= 30)
        return {
          icon: (
            <ThumbsUp
              size={14}
              className="text-green-500"
              fill="currentColor"
            />
          ),
          label: "Good",
          color: "bg-green-50 text-green-600",
        };
    }
    return null;
  };

  const copyDailyReport = () => {
    const cur = records[date] || {};
    const dailyTotal =
      (cur.genCash || 0) +
      (cur.genBig || 0) +
      (cur.genSmall || 0) +
      Object.values(cur.empData || {}).reduce(
        (a, v) =>
          a +
          (parseInt(v.cash) || 0) +
          (parseInt(v.big) || 0) +
          (parseInt(v.small) || 0),
        0
      );
    const expTotal = (cur.expenses || []).reduce((a, v) => a + v.amount, 0);
    const report = `[${date} 마감 리포트]\n\n💰 총 매출: ${fmt(
      dailyTotal
    )}\n💸 총 지출: ${fmt(expTotal)}\n\n- 현금: ${fmt(
      cur.genCash || 0
    )}\n- 큰단말기: ${fmt(cur.genBig || 0)}\n- 작은단말기: ${fmt(
      cur.genSmall || 0
    )}\n\n수고하셨습니다!`;
    navigator.clipboard
      .writeText(report)
      .then(() => alert("마감 리포트가 복사되었습니다!"));
  };

  const downloadCSV = () => {
    let csv =
      "data:text/csv;charset=utf-8,\uFEFF기간,총매출,총지출,인건비,실입금\n";
    csv += `${stats.period},${stats.rev},${stats.exp},${stats.pay},${stats.real}\n\n직원명,근무시간,급여,교통비,3.3%공제,실수령액\n`;
    Object.values(stats.emps).forEach((e) => {
      const totalTaxable = e.pay + e.inc;
      const tax = e.useTax ? totalTaxable * 0.033 : 0;
      csv += `${e.name},${e.hours.toFixed(1)},${totalTaxable.toFixed(0)},${
        e.transportPay
      },${tax.toFixed(0)},${(totalTaxable - tax + e.transportPay).toFixed(
        0
      )}\n`;
    });
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `정산_${stats.period}.csv`;
    document.body.appendChild(link);
    link.click();
  };
  const downloadPayslip = async (empId) => {
    const emp = payslipStats.emps[empId];
    if (!emp || emp.hours === 0) return alert("근무 기록 없음");
    const element = document.getElementById(`payslip-${empId}`);
    if (!element) return;
    element.style.display = "block";
    try {
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${emp.name}_급여명세서_${payslipStats.period}.png`;
      link.click();
    } catch (e) {
      alert("이미지 실패");
    }
    element.style.display = "none";
  };

  const handleLoginSuccess = (id, remember, password) => {
    if (remember) {
      localStorage.setItem("saved_store_id", id);
      localStorage.setItem("saved_password", btoa(password));
      localStorage.setItem("active_store_id", id);
    } else {
      localStorage.removeItem("saved_store_id");
      localStorage.removeItem("saved_password");
      localStorage.setItem("active_store_id", id);
    }
    setStoreId(id);
  };

  const updateInventory = (idx, field, val) => {
    const n = [...(appSettings.inventory || [])];
    const oldVal = n[idx][field];
    n[idx][field] = val;
    if (field === "stock" && oldVal !== val) {
      const diff = val - oldVal;
      const log = {
        date: new Date().toISOString(),
        name: n[idx].name,
        change: diff,
        final: val,
      };
      const newLogs = [log, ...(appSettings.inventoryLogs || [])].slice(0, 50);
      saveSet({ ...appSettings, inventory: n, inventoryLogs: newLogs });
    } else {
      saveSet({ ...appSettings, inventory: n });
    }
  };

  if (!isAuthReady || isLoginCheckLoading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-500 mb-2" size={40} />
        <span className="text-sm text-slate-500 font-medium animate-pulse">
          {isLoginCheckLoading
            ? "자동 로그인 확인 중..."
            : "매장 데이터를 불러오는 중..."}
        </span>
      </div>
    );
  if (!storeId) return <StoreAuth user={user} onLogin={handleLoginSuccess} />;

  const cur = records[date] || {};

  return (
    <div
      className={`max-w-3xl mx-auto min-h-screen pb-24 font-sans transition-colors duration-300 ${bgMain} ${textMain}`}
    >
      <header
        className={`sticky top-0 z-20 flex justify-between items-center px-5 py-4 backdrop-blur-lg border-b transition-colors ${
          isDark
            ? "bg-slate-900/90 border-slate-800"
            : "bg-white/90 border-gray-100"
        }`}
      >
        {editTitle ? (
          <div className="flex gap-2">
            <input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              className="border p-1 rounded text-sm text-gray-800"
            />
            <button
              onClick={() => {
                saveSet({ ...appSettings, appTitle: tempTitle });
                setEditTitle(false);
              }}
              className="bg-blue-500 text-white text-xs px-2 rounded"
            >
              저장
            </button>
          </div>
        ) : (
          <h1
            onClick={() => {
              setTempTitle(appSettings.appTitle);
              setEditTitle(true);
            }}
            className="font-bold text-xl flex gap-2 cursor-pointer tracking-tight"
          >
            {appSettings.appTitle} <Edit2 size={16} className="opacity-50" />
          </h1>
        )}
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border ${
              isDark
                ? "bg-indigo-900 text-indigo-200 border-indigo-800"
                : "bg-indigo-50 text-indigo-600 border-indigo-100"
            }`}
          >
            <Store size={10} /> {storeId}
          </span>
          <span className="text-xs font-bold text-green-500 min-w-[20px]">
            {status}
          </span>
        </div>
      </header>

      <main className="p-5 space-y-6">
        {tab === "home" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
            <div
              className={`${cardBg} p-6 rounded-3xl shadow-sm border relative overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
              <h2
                className={`font-bold text-lg mb-5 relative z-10 leading-relaxed break-keep ${
                  isDark ? "text-slate-200" : "text-gray-800"
                }`}
              >
                {randomGreeting}
              </h2>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div
                  className={`${
                    isDark
                      ? "bg-slate-700/50 border-slate-600"
                      : "bg-blue-50/50 border-blue-100"
                  } p-5 rounded-2xl border transition-colors`}
                >
                  <div className="text-xs font-bold text-blue-400 mb-1.5 uppercase tracking-wider">
                    Total Sales
                  </div>
                  <div
                    className={`text-2xl font-black ${
                      isDark ? "text-blue-300" : "text-blue-900"
                    }`}
                  >
                    {fmt(stats.rev)}
                  </div>
                </div>
                <div
                  className={`${
                    isDark
                      ? "bg-slate-700/50 border-slate-600"
                      : "bg-emerald-50/50 border-emerald-100"
                  } p-5 rounded-2xl border transition-colors`}
                >
                  <div className="text-xs font-bold text-emerald-400 mb-1.5 uppercase tracking-wider">
                    Est. Deposit
                  </div>
                  <div
                    className={`text-2xl font-black ${
                      isDark ? "text-emerald-300" : "text-emerald-900"
                    }`}
                  >
                    {fmt(stats.real)}
                  </div>
                </div>
              </div>
            </div>
            <MemoBoard
              memo={appSettings.memo}
              onSave={(t) => saveSet({ ...appSettings, memo: t })}
              isDark={isDark}
            />
            <AICoach stats={stats} isDark={isDark} />
            <div className="grid grid-cols-3 gap-4">
              {[
                ["daily", "오늘 기록", Edit2, "text-blue-600", "bg-blue-100"],
                [
                  "schedule",
                  "스케줄",
                  Clock,
                  "text-purple-600",
                  "bg-purple-100",
                ],
                [
                  "inventory",
                  "재고 확인",
                  Package,
                  "text-emerald-600",
                  "bg-emerald-100",
                ],
              ].map(([k, l, I, tc, bc]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`${cardBg} p-5 rounded-2xl shadow-sm border flex flex-col items-center gap-3 hover:shadow-md hover:-translate-y-1 transition-all group`}
                >
                  <div
                    className={`${bc} p-3 rounded-xl ${tc} group-hover:scale-110 transition-transform`}
                  >
                    <I size={20} />
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isDark ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    {l}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "calendar" && (
          <div
            className={`${cardBg} rounded-3xl shadow-sm border p-6 h-[75vh] flex flex-col animate-in fade-in`}
          >
            <div className="flex justify-between mb-6 items-center">
              <button
                onClick={() => {
                  const d = new Date(date);
                  d.setMonth(d.getMonth() - 1);
                  setDate(getLocalDay(d));
                }}
                className={`p-2 rounded-full ${
                  isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"
                }`}
              >
                <ChevronLeft />
              </button>
              <span className="font-bold text-xl tracking-tight">
                {new Date(date).getFullYear()}년 {new Date(date).getMonth() + 1}
                월
              </span>
              <button
                onClick={() => {
                  const d = new Date(date);
                  d.setMonth(d.getMonth() + 1);
                  setDate(getLocalDay(d));
                }}
                className={`p-2 rounded-full ${
                  isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"
                }`}
              >
                <ChevronRight />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2 flex-1">
              {(() => {
                const year = new Date(date).getFullYear();
                const month = new Date(date).getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const daysInMonth = lastDay.getDate();
                const startDayIdx = (firstDay.getDay() + 6) % 7;
                const days = [];
                for (let i = 0; i < startDayIdx; i++) days.push(null);
                for (let i = 1; i <= daysInMonth; i++)
                  days.push(new Date(year, month, i));
                return days.map((d, i) => {
                  if (!d)
                    return (
                      <div
                        key={`empty-${i}`}
                        className={`${
                          isDark ? "bg-slate-800/50" : "bg-gray-50/50"
                        } rounded-xl`}
                      ></div>
                    );
                  const ds = getLocalDay(d);
                  const r = records[ds];
                  let tot =
                    (r?.genCash || 0) + (r?.genBig || 0) + (r?.genSmall || 0);
                  Object.values(r?.empData || {}).forEach(
                    (v) =>
                      (tot +=
                        (parseInt(v.cash) || 0) +
                        (parseInt(v.big) || 0) +
                        (parseInt(v.small) || 0))
                  );
                  const dayOfWeek = i % 7;
                  const dayColor =
                    dayOfWeek === 6
                      ? "text-red-500"
                      : dayOfWeek === 5
                      ? "text-blue-500"
                      : isDark
                      ? "text-slate-300"
                      : "text-gray-700";
                  const isSunday = dayOfWeek === 6;
                  const sundayTotal = stats.weekTotals[ds] || 0;
                  return (
                    <div
                      key={ds}
                      onClick={() => {
                        setDate(ds);
                        setTab("daily");
                      }}
                      className={`border rounded-xl p-1 flex flex-col items-center justify-start cursor-pointer overflow-hidden hover:shadow-md transition-all relative ${
                        ds === getLocalDay(new Date())
                          ? isDark
                            ? "bg-indigo-900/30 border-indigo-700"
                            : "bg-indigo-50 border-indigo-200"
                          : isDark
                          ? "border-slate-700"
                          : "border-gray-100"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-extrabold mb-0.5 ${dayColor}`}
                      >
                        {d.getDate()}
                      </span>
                      {tot > 0 && (
                        <span
                          className={`text-[8px] font-bold px-1 rounded-sm ${
                            isDark
                              ? "bg-emerald-900 text-emerald-300"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {(tot / 10000).toFixed(0)}만
                        </span>
                      )}
                      {isSunday && sundayTotal > 0 && (
                        <span className="absolute bottom-1 right-1 text-[7px] bg-red-500 text-white px-1 py-0.5 rounded-md font-bold shadow-sm">
                          {(sundayTotal / 10000).toFixed(0)}만
                        </span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {tab === "schedule" && (
          <ScheduleManager
            emps={appSettings.employees}
            storeId={storeId}
            appId={appId}
            isDark={isDark}
          />
        )}

        {tab === "daily" && (
          <div className="animate-in slide-in-from-bottom-5 duration-500 space-y-5">
            <div
              className={`flex justify-between items-center p-4 rounded-2xl shadow-sm border ${cardBg}`}
            >
              <button
                onClick={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() - 1);
                  setDate(getLocalDay(d));
                }}
                className={`p-2 rounded-full ${
                  isDark ? "hover:bg-slate-700" : "hover:bg-gray-50"
                }`}
              >
                <ChevronLeft />
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="font-bold bg-transparent text-center outline-none text-lg"
                />
                <span
                  className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                    isDark
                      ? "bg-slate-700 text-slate-300"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {
                    dayNames[
                      new Date(date).getDay() === 0
                        ? 6
                        : new Date(date).getDay() - 1
                    ]
                  }
                </span>
              </div>
              <button
                onClick={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() + 1);
                  setDate(getLocalDay(d));
                }}
                className={`p-2 rounded-full ${
                  isDark ? "hover:bg-slate-700" : "hover:bg-gray-50"
                }`}
              >
                <ChevronRight />
              </button>
            </div>

            <button
              onClick={copyDailyReport}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm ${
                isDark
                  ? "bg-indigo-900 text-indigo-200"
                  : "bg-indigo-50 text-indigo-600"
              }`}
            >
              <Copy size={16} /> 마감 리포트 복사 (카카오톡)
            </button>

            <VisitLogger
              data={cur}
              emps={appSettings.employees}
              inventory={appSettings.inventory || []}
              onSave={handleVisitSave}
              onDelete={handleVisitDelete}
              isDark={isDark}
              crmData={crmData}
            />
            <ExpenseLogger
              data={cur}
              onSave={(d) => saveRec(date, d)}
              isDark={isDark}
            />

            <div className={`p-5 rounded-2xl shadow-sm border ${cardBg}`}>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <div className="bg-green-50 p-1.5 rounded-lg text-green-600">
                  <Wallet size={18} />
                </div>{" "}
                비지명 매출
              </h3>
              {/* Fix 8: Changed layout to flex-col for wider inputs */}
              <div className="flex flex-col gap-3 text-sm">
                <div
                  className={`p-3 rounded-xl border flex justify-between items-center ${
                    isDark
                      ? "bg-slate-700/50 border-slate-600"
                      : "bg-green-50/50 border-green-100"
                  }`}
                >
                  <div className="text-[10px] font-bold text-green-500 uppercase">
                    현금 매출
                  </div>
                  {/* Changed to w-[60%] for responsive width */}
                  <input
                    type="number"
                    value={cur.genCash || ""}
                    onChange={(e) =>
                      saveRec(date, {
                        ...cur,
                        genCash: parseInt(e.target.value) || 0,
                      })
                    }
                    className={`w-[60%] border p-2 rounded-lg text-right font-bold outline-none ${
                      isDark
                        ? "bg-slate-800 border-slate-600 text-white"
                        : "bg-white border-green-200 text-green-900"
                    }`}
                  />
                </div>
                <div
                  className={`p-3 rounded-xl border flex justify-between items-center ${
                    isDark
                      ? "bg-slate-700/50 border-slate-600"
                      : "bg-blue-50/50 border-blue-100"
                  }`}
                >
                  <div className="text-[10px] font-bold text-blue-500 uppercase">
                    큰 단말기
                  </div>
                  <input
                    type="number"
                    value={cur.genBig || ""}
                    onChange={(e) =>
                      saveRec(date, {
                        ...cur,
                        genBig: parseInt(e.target.value) || 0,
                      })
                    }
                    className={`w-[60%] border p-2 rounded-lg text-right font-bold outline-none ${
                      isDark
                        ? "bg-slate-800 border-slate-600 text-white"
                        : "bg-white border-blue-200 text-blue-900"
                    }`}
                  />
                </div>
                <div
                  className={`p-3 rounded-xl border flex justify-between items-center ${
                    isDark
                      ? "bg-slate-700/50 border-slate-600"
                      : "bg-indigo-50/50 border-indigo-100"
                  }`}
                >
                  <div className="text-[10px] font-bold text-indigo-500 uppercase">
                    작은 단말기
                  </div>
                  <input
                    type="number"
                    value={cur.genSmall || ""}
                    onChange={(e) =>
                      saveRec(date, {
                        ...cur,
                        genSmall: parseInt(e.target.value) || 0,
                      })
                    }
                    className={`w-[60%] border p-2 rounded-lg text-right font-bold outline-none ${
                      isDark
                        ? "bg-slate-800 border-slate-600 text-white"
                        : "bg-white border-indigo-200 text-indigo-900"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl shadow-sm border ${cardBg}`}>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <div className="bg-orange-50 p-1.5 rounded-lg text-orange-600">
                  <User size={18} />
                </div>{" "}
                근무 직원
              </h3>
              <div className="flex gap-3 mb-5">
                <select
                  value={selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value)}
                  className={`flex-1 p-3 border rounded-xl text-sm outline-none ${
                    isDark
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-200 focus:border-orange-400"
                  }`}
                >
                  <option value="">+ 근무자 선택</option>
                  {(appSettings.employees || [])
                    .filter((e) => !cur.empData?.[e.id])
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    if (!selectedEmp) return;
                    saveRec(date, {
                      ...cur,
                      empData: {
                        ...(cur.empData || {}),
                        [selectedEmp]: {
                          start: "20:00",
                          end: "02:00",
                          cash: "",
                          big: "",
                          small: "",
                          tr: false,
                        },
                      },
                    });
                    setSelectedEmp("");
                  }}
                  className="bg-orange-500 text-white px-4 rounded-xl font-bold shadow-sm hover:bg-orange-600"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-3">
                {Object.entries(cur.empData || {}).map(([id, v]) => {
                  const emp = (appSettings.employees || []).find(
                    (e) => e.id.toString() === id
                  );
                  if (!emp) return null;
                  const update = (f, val) =>
                    saveRec(date, {
                      ...cur,
                      empData: { ...cur.empData, [id]: { ...v, [f]: val } },
                    });
                  return (
                    <div
                      key={id}
                      className={`p-4 rounded-xl border relative group transition-colors ${
                        isDark
                          ? "bg-slate-700/50 border-slate-600 hover:border-orange-500/50"
                          : "bg-gray-50 border-gray-200 hover:border-orange-200"
                      }`}
                    >
                      <div className="flex justify-between mb-3">
                        <span className="font-bold flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          {emp.name}
                        </span>
                        <div className="flex gap-3 items-center">
                          <label
                            className={`text-xs flex gap-1 cursor-pointer font-bold ${
                              isDark
                                ? "text-slate-400"
                                : "text-gray-500 hover:text-blue-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={v.tr || false}
                              onChange={(e) => update("tr", e.target.checked)}
                              className="accent-blue-500"
                            />{" "}
                            교통비
                          </label>
                          <DeleteBtn
                            onClick={() => {
                              const n = { ...cur.empData };
                              delete n[id];
                              saveRec(date, { ...cur, empData: n });
                            }}
                            isDark={isDark}
                          />
                        </div>
                      </div>
                      <div
                        className={`flex gap-2 mb-3 items-center p-2 rounded-lg border ${
                          isDark
                            ? "bg-slate-800 border-slate-600"
                            : "bg-white border-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-gray-400" />
                        </div>
                        <div className="flex items-center">
                          <select
                            value={v.start?.split(":")[0] || ""}
                            onChange={(e) =>
                              update(
                                "start",
                                `${e.target.value}:${
                                  v.start?.split(":")[1] || "00"
                                }`
                              )
                            }
                            className={`text-xs p-1 outline-none font-bold bg-transparent ${
                              isDark ? "text-white" : "text-gray-800"
                            }`}
                          >
                            <option value="">시</option>
                            {HOURS.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                          <span className="px-0.5">:</span>
                          <select
                            value={v.start?.split(":")[1] || ""}
                            onChange={(e) =>
                              update(
                                "start",
                                `${v.start?.split(":")[0] || "00"}:${
                                  e.target.value
                                }`
                              )
                            }
                            className={`text-xs p-1 outline-none font-bold bg-transparent ${
                              isDark ? "text-white" : "text-gray-800"
                            }`}
                          >
                            <option value="">분</option>
                            {MINUTES.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                        <span className="text-gray-300 text-xs">~</span>
                        <div className="flex items-center">
                          <select
                            value={v.end?.split(":")[0] || ""}
                            onChange={(e) =>
                              update(
                                "end",
                                `${e.target.value}:${
                                  v.end?.split(":")[1] || "00"
                                }`
                              )
                            }
                            className={`text-xs p-1 outline-none font-bold bg-transparent ${
                              isDark ? "text-white" : "text-gray-800"
                            }`}
                          >
                            <option value="">시</option>
                            {HOURS.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                          <span className="px-0.5">:</span>
                          <select
                            value={v.end?.split(":")[1] || ""}
                            onChange={(e) =>
                              update(
                                "end",
                                `${v.end?.split(":")[0] || "00"}:${
                                  e.target.value
                                }`
                              )
                            }
                            className={`text-xs p-1 outline-none font-bold bg-transparent ${
                              isDark ? "text-white" : "text-gray-800"
                            }`}
                          >
                            <option value="">분</option>
                            {MINUTES.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <input
                          type="number"
                          placeholder="현금"
                          value={v.cash || ""}
                          onChange={(e) => update("cash", e.target.value)}
                          className={`border p-2 rounded-lg text-right focus:ring-1 outline-none ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-white focus:ring-green-500"
                              : "bg-white focus:ring-green-500"
                          }`}
                        />
                        <input
                          type="number"
                          placeholder="큰 단말기"
                          value={v.big || ""}
                          onChange={(e) => update("big", e.target.value)}
                          className={`border p-2 rounded-lg text-right focus:ring-1 outline-none ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-white focus:ring-blue-500"
                              : "bg-white focus:ring-blue-500"
                          }`}
                        />
                        <input
                          type="number"
                          placeholder="작은 단말기"
                          value={v.small || ""}
                          onChange={(e) => update("small", e.target.value)}
                          className={`border p-2 rounded-lg text-right focus:ring-1 outline-none ${
                            isDark
                              ? "bg-slate-800 border-slate-600 text-white focus:ring-indigo-500"
                              : "bg-white focus:ring-indigo-500"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "report" && (
          <div className="space-y-5 animate-in slide-in-from-bottom-5 duration-500">
            <div
              className={`p-2 rounded-xl flex gap-1 border shadow-sm ${cardBg}`}
            >
              <button
                onClick={() => setRMode("weekly")}
                className={`flex-1 py-2 text-sm rounded-lg transition-all font-bold ${
                  rMode === "weekly"
                    ? "bg-gray-800 text-white shadow-md"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                주간 정산
              </button>
              <button
                onClick={() => setRMode("monthly")}
                className={`flex-1 py-2 text-sm rounded-lg transition-all font-bold ${
                  rMode === "monthly"
                    ? "bg-gray-800 text-white shadow-md"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                월간 정산
              </button>
              <input
                type={rMode === "weekly" ? "date" : "month"}
                value={rMode === "weekly" ? rDate : rDate.slice(0, 7)}
                onChange={(e) => setRDate(e.target.value)}
                className={`bg-transparent border-none text-sm font-bold px-4 outline-none ${
                  isDark ? "text-slate-300" : "text-gray-600"
                }`}
              />
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
              <button
                onClick={downloadCSV}
                className="absolute top-5 right-5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-bold transition-colors z-10"
              >
                <Download size={12} /> 엑셀
              </button>

              <div className="text-center mb-8 relative z-10">
                <div className="text-gray-400 text-xs mb-1 font-medium uppercase tracking-wider">
                  Total Revenue
                </div>
                <div className="text-4xl font-black text-gray-800 mb-2">
                  {fmt(stats.rev)}
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {stats.period}
                </div>
                <div className="flex justify-center gap-3 mt-4">
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-100">
                    큰: {stats.bigRate}%
                  </span>
                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-100">
                    작: {stats.smallRate}%
                  </span>
                </div>
              </div>

              {/* Added Sales Trend Chart with improved UI/UX */}
              <div
                className={`mb-6 relative z-10 p-3 rounded-2xl border ${
                  isDark
                    ? "bg-slate-700/50 border-slate-600"
                    : "bg-gray-50/50 border-gray-100"
                }`}
              >
                <div className="text-xs font-bold opacity-50 mb-1 flex items-center gap-1">
                  <TrendingUp size={12} /> 주간 매출 추이
                </div>
                <SalesTrendChart
                  data={stats.days}
                  labels={dayNames}
                  isDark={isDark}
                />
              </div>

              <div className="space-y-3 mb-6 text-sm relative z-10">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-500 font-medium">(-) 총 지출</span>
                  <span className="font-bold text-gray-700">
                    {fmt(stats.exp)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <span className="text-orange-700 font-medium flex items-center gap-1">
                    (-) 총 인건비{" "}
                    <span className="text-[10px] bg-white/50 px-1.5 rounded-md">
                      ({stats.laborRate}%)
                    </span>
                  </span>
                  <span className="font-bold text-orange-800">
                    {fmt(stats.pay)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-purple-700 font-medium">
                    (-) 부가세 (예상)
                  </span>
                  <span className="font-bold text-purple-800">
                    {fmt(stats.vat)}
                  </span>
                </div>
                {rMode === "monthly" && (
                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded-xl border border-gray-200">
                    <span className="text-gray-600 font-medium">
                      (-) 고정비
                    </span>
                    <span className="font-bold text-gray-700">
                      {fmt(stats.fixed)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-5 flex justify-between items-center relative z-10">
                <span className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <CheckCircle2 className="text-green-500" size={20} /> 순이익
                  (예상)
                </span>
                <span className="font-black text-2xl text-indigo-600">
                  {fmt(stats.netIncome)}
                </span>
              </div>
            </div>

            {/* Expense Pie Chart */}
            <div className={`${cardBg} p-5 rounded-2xl shadow-sm border`}>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <div className="bg-pink-100 p-1.5 rounded-lg text-pink-600">
                  <TrendingUp size={18} />
                </div>{" "}
                지출 분석
              </h3>
              <SimplePieChart data={stats.pieData} isDark={isDark} />
            </div>

            <div className={`${cardBg} p-5 rounded-2xl shadow-sm border`}>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <div className="bg-yellow-100 p-1.5 rounded-lg text-yellow-600">
                  <Trophy size={18} />
                </div>{" "}
                🏆 지명 랭킹
              </h3>
              {Object.keys(stats.des).length === 0 ? (
                <div className="text-center text-xs opacity-40 py-6">
                  데이터가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.des)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([id, count], idx) => {
                      const empName =
                        (appSettings.employees || []).find(
                          (e) => e.id.toString() === id
                        )?.name || "퇴사자";
                      const rankColor =
                        idx === 0
                          ? "bg-yellow-400 text-white"
                          : idx === 1
                          ? "bg-gray-300 text-white"
                          : idx === 2
                          ? "bg-orange-300 text-white"
                          : "bg-gray-100 text-gray-500";
                      return (
                        <div
                          key={id}
                          className={`flex items-center justify-between text-sm`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rankColor}`}
                            >
                              {idx + 1}
                            </span>
                            <span
                              className={`font-bold ${
                                isDark ? "text-slate-300" : "text-gray-700"
                              }`}
                            >
                              {empName}
                            </span>
                          </div>
                          <div
                            className={`font-bold px-2 py-0.5 rounded-md text-xs ${
                              isDark
                                ? "text-indigo-300 bg-slate-700"
                                : "text-indigo-600 bg-indigo-50"
                            }`}
                          >
                            {count}회
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Fix 5: Adjusted font size and padding to fit mobile screen */}
            <div
              className={`${cardBg} rounded-2xl shadow-sm border overflow-hidden overflow-x-auto`}
            >
              <table className="w-full text-[10px] text-left whitespace-nowrap">
                <thead
                  className={`border-b uppercase tracking-wider ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-slate-500"
                      : "bg-gray-50 border-gray-100 text-gray-500"
                  }`}
                >
                  <tr>
                    <th className="p-1.5 font-bold">이름</th>
                    <th className="p-1.5 text-center font-bold">근무</th>
                    <th className="p-1.5 text-right font-bold">급여</th>
                    {/* 1. Reordered Columns: Tax -> Transport */}
                    <th className="p-1.5 text-right font-bold text-red-500">
                      3.3%
                    </th>
                    <th className="p-1.5 text-right font-bold text-blue-600">
                      교통비
                    </th>
                    <th className="p-1.5 text-right font-bold">실지급</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDark ? "divide-slate-700" : "divide-gray-50"
                  }`}
                >
                  {Object.values(stats.emps).map((e, i) => {
                    const totalTaxable = e.pay + e.inc;
                    const tax = e.useTax ? totalTaxable * 0.033 : 0;
                    return (
                      <tr
                        key={i}
                        className={`${
                          isDark
                            ? "hover:bg-slate-700/30"
                            : "hover:bg-gray-50/50"
                        } transition-colors`}
                      >
                        <td className="p-1.5 font-bold">{e.name}</td>
                        <td className="p-1.5 text-center opacity-60">
                          {e.hours.toFixed(1)}h
                        </td>
                        <td className="p-1.5 text-right opacity-80">
                          {fmt(totalTaxable)}
                        </td>
                        <td className="p-1.5 text-right text-red-400">
                          {tax > 0 ? `-${fmt(tax)}` : "-"}
                        </td>
                        <td className="p-1.5 text-right text-blue-600 font-medium">
                          {fmt(e.transportPay)}
                        </td>
                        <td className="p-1.5 text-right font-black text-emerald-600">
                          {fmt(totalTaxable - tax + e.transportPay)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "crm" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center px-2">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Heart size={20} className="text-pink-500" /> 단골 손님
              </h2>
              {/* 2. CRM Search */}
              <div
                className={`flex items-center px-3 py-1.5 rounded-full border ${inputClass}`}
              >
                <Search size={14} className="opacity-50 mr-2" />
                <input
                  placeholder="이름 검색"
                  value={crmSearch}
                  onChange={(e) => setCrmSearch(e.target.value)}
                  className="bg-transparent outline-none text-sm w-24"
                />
              </div>
            </div>

            {crmData.length === 0 ? (
              <div className="text-center text-xs opacity-40 py-10">
                데이터가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {crmData.slice((crmPage - 1) * 10, crmPage * 10).map((c, i) => {
                  const rankBadge = getRankBadge(
                    i + (crmPage - 1) * 10,
                    crmData.length,
                    "spent"
                  );
                  const visitBadge = getRankBadge(
                    Object.values(crmData)
                      .sort((a, b) => b.visits - a.visits)
                      .findIndex((x) => x.name === c.name),
                    crmData.length,
                    "visit"
                  );

                  return (
                    <div
                      key={i}
                      className={`${cardBg} p-4 rounded-2xl shadow-sm border relative overflow-hidden group`}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-400 to-purple-400"></div>
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-lg">{c.name}</span>
                            {/* 3. VIP Badges */}
                            {rankBadge && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${rankBadge.color}`}
                              >
                                {rankBadge.icon} {rankBadge.label}
                              </span>
                            )}
                            {visitBadge && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${visitBadge.color}`}
                              >
                                {visitBadge.icon} {visitBadge.label}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] opacity-50 mt-0.5 flex items-center gap-1">
                            <Clock size={10} /> 최근: {c.lastVisit}
                          </div>
                          {/* 4. Preferred Menu */}
                          {c.favMenu && c.favMenu !== "없음" && (
                            <div className="text-[10px] text-pink-500 mt-1 font-bold">
                              ❤️ 최애: {c.favMenu}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-black text-lg text-indigo-600">
                            {fmt(c.spent)}
                          </div>
                          <div
                            className={`text-xs font-medium px-2 py-0.5 rounded inline-block ${
                              isDark
                                ? "bg-slate-700 text-slate-400"
                                : "bg-gray-50 text-gray-500"
                            }`}
                          >
                            {c.visits}회 방문
                          </div>
                        </div>
                      </div>
                      <div className="pl-2 mt-3">
                        <input
                          placeholder="특이사항 메모..."
                          value={appSettings.customerMemos?.[c.name] || ""}
                          onChange={(e) => {
                            saveSet({
                              ...appSettings,
                              customerMemos: {
                                ...(appSettings.customerMemos || {}),
                                [c.name]: e.target.value,
                              },
                            });
                          }}
                          className={`w-full text-xs p-2 rounded-lg border-none focus:ring-2 transition-all ${
                            isDark
                              ? "bg-slate-700 focus:ring-indigo-500"
                              : "bg-gray-50 focus:ring-pink-100"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {crmData.length > 10 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  disabled={crmPage === 1}
                  onClick={() => setCrmPage((p) => p - 1)}
                  className={`px-4 py-2 border rounded-xl text-xs font-bold disabled:opacity-30 ${cardClass}`}
                >
                  이전
                </button>
                <span className="py-2 text-sm font-bold opacity-50">
                  {crmPage} / {Math.ceil(crmData.length / 10)}
                </span>
                <button
                  disabled={crmPage === Math.ceil(crmData.length / 10)}
                  onClick={() => setCrmPage((p) => p + 1)}
                  className={`px-4 py-2 border rounded-xl text-xs font-bold disabled:opacity-30 ${cardClass}`}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}

        {/* Fix 6: Using InventoryItem sub-component */}
        {tab === "inventory" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center px-2">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Package size={20} className="text-emerald-500" /> 재고 & 메뉴
              </h2>
              <div className="flex gap-2">
                {/* 5. Log Viewer Toggle could go here */}
                <button
                  onClick={() =>
                    saveSet({
                      ...appSettings,
                      inventory: [
                        ...(appSettings.inventory || []),
                        { name: "", price: "", stock: 0 },
                      ],
                    })
                  }
                  className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-1"
                >
                  <Plus size={14} /> 추가
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {(appSettings.inventory || []).map((item, idx) => (
                <InventoryItem
                  key={idx}
                  item={item}
                  idx={idx}
                  isDark={isDark}
                  onUpdate={updateInventory}
                  onDelete={(i) =>
                    saveSet({
                      ...appSettings,
                      inventory: appSettings.inventory.filter(
                        (_, ix) => ix !== i
                      ),
                    })
                  }
                />
              ))}
            </div>
            {/* 5. Inventory Logs View */}
            <div
              className={`p-4 rounded-2xl border text-xs h-32 overflow-y-auto ${cardClass}`}
            >
              <div className="font-bold mb-2 flex gap-2 sticky top-0 bg-inherit z-10 pb-1 border-b">
                <History size={12} /> 재고 변경 로그 (최근 50건)
              </div>
              {(appSettings.inventoryLogs || []).length === 0 ? (
                <div className="text-center opacity-50 py-2">기록 없음</div>
              ) : (
                (appSettings.inventoryLogs || []).map((l, i) => (
                  <div
                    key={i}
                    className="flex justify-between opacity-70 py-1 border-b border-dashed border-gray-100 last:border-0"
                  >
                    <span className="font-bold">{l.name}</span>
                    <div className="flex gap-2">
                      <span
                        className={
                          l.change > 0 ? "text-green-500" : "text-red-500"
                        }
                      >
                        {l.change > 0 ? "+" : ""}
                        {l.change} ({l.final})
                      </span>
                      <span className="opacity-50">
                        {new Date(l.date).toLocaleDateString()}{" "}
                        {new Date(l.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "employees" && (
          <div className={`p-4 rounded-xl shadow animate-in fade-in ${cardBg}`}>
            <h2 className="font-bold mb-4 flex items-center gap-2 text-blue-600">
              <User size={20} /> 직원 관리
            </h2>
            <div
              className={`p-2 rounded mb-4 flex justify-between items-center border ${
                isDark ? "bg-slate-700 border-slate-600" : "bg-gray-50"
              }`}
            >
              <span className="text-xs font-bold opacity-60">
                급여명세서 기준 주간:
              </span>
              {/* 2. Fix date input display */}
              <input
                type="date"
                value={getLocalDay(payslipWeek)}
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                  setPayslipWeek(new Date(d.setDate(diff)));
                }}
                className={`text-xs border rounded p-1 ${
                  isDark
                    ? "bg-slate-600 text-white border-slate-500"
                    : "bg-white border-gray-200"
                }`}
              />
            </div>

            {appSettings.employees.map((e) => (
              <div
                key={e.id}
                className={`${cardBg} p-4 rounded-xl border shadow-sm mb-3 relative overflow-hidden`}
              >
                {/* Improved Card Layout */}
                <div className="absolute top-0 right-0 bg-blue-50 px-3 py-1 rounded-bl-lg border-l border-b border-blue-100 flex gap-2">
                  <button
                    onClick={() => downloadPayslip(e.id)}
                    title="급여명세서 다운로드"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <FileText size={14} />
                  </button>
                  <DeleteBtn
                    onClick={() =>
                      saveSet({
                        ...appSettings,
                        employees: appSettings.employees.filter(
                          (x) => x.id !== e.id
                        ),
                      })
                    }
                    isDark={isDark}
                  />
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <div className="flex flex-col">
                    <label className="text-[10px] opacity-50 font-bold">
                      이름
                    </label>
                    <input
                      value={e.name}
                      onChange={(ev) => {
                        const n = [...appSettings.employees];
                        n.find((x) => x.id === e.id).name = ev.target.value;
                        saveSet({ ...appSettings, employees: n });
                      }}
                      className="border-b-2 border-blue-500 w-20 font-bold text-lg focus:outline-none pb-1 bg-transparent"
                    />
                  </div>
                </div>

                <div
                  className={`grid grid-cols-2 gap-3 mb-3 p-3 rounded-lg ${
                    isDark ? "bg-slate-700" : "bg-gray-50"
                  }`}
                >
                  <div>
                    <label className="text-[10px] opacity-50 block mb-1">
                      시급
                    </label>
                    <div
                      className={`flex items-center border rounded px-2 py-1 ${
                        isDark ? "bg-slate-600 border-slate-500" : "bg-white"
                      }`}
                    >
                      <input
                        type="number"
                        value={e.hourlyRate}
                        onChange={(ev) => {
                          const n = [...appSettings.employees];
                          n.find((x) => x.id === e.id).hourlyRate = parseInt(
                            ev.target.value
                          );
                          saveSet({ ...appSettings, employees: n });
                        }}
                        className="w-full font-bold text-right outline-none bg-transparent"
                      />
                      <span className="text-xs opacity-50 ml-1">원</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] opacity-50 block mb-1">
                      인센티브
                    </label>
                    <div
                      className={`flex items-center border rounded px-2 py-1 ${
                        isDark ? "bg-slate-600 border-slate-500" : "bg-white"
                      }`}
                    >
                      <input
                        type="number"
                        value={e.incentiveRate}
                        onChange={(ev) => {
                          const n = [...appSettings.employees];
                          n.find((x) => x.id === e.id).incentiveRate =
                            parseFloat(ev.target.value);
                          saveSet({ ...appSettings, employees: n });
                        }}
                        className="w-full font-bold text-center outline-none bg-transparent"
                      />
                      <span className="text-xs opacity-50 ml-1">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] opacity-50 block mb-1">
                      교통비(일)
                    </label>
                    <div
                      className={`flex items-center border rounded px-2 py-1 ${
                        isDark ? "bg-slate-600 border-slate-500" : "bg-white"
                      }`}
                    >
                      <input
                        type="number"
                        value={e.transportFee}
                        onChange={(ev) => {
                          const n = [...appSettings.employees];
                          n.find((x) => x.id === e.id).transportFee = parseInt(
                            ev.target.value
                          );
                          saveSet({ ...appSettings, employees: n });
                        }}
                        className="w-full text-right outline-none bg-transparent"
                      />
                      <span className="text-xs opacity-50 ml-1">원</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={e.useTax || false}
                        onChange={(ev) => {
                          const n = [...appSettings.employees];
                          n.find((x) => x.id === e.id).useTax =
                            ev.target.checked;
                          saveSet({ ...appSettings, employees: n });
                        }}
                        className="w-4 h-4 accent-blue-500"
                      />
                      <span className="text-xs font-bold opacity-70">
                        3.3% 공제
                      </span>
                    </label>
                  </div>
                </div>
                <input
                  placeholder="직원 특이사항 메모..."
                  value={e.remarks || ""}
                  onChange={(ev) => {
                    const n = [...appSettings.employees];
                    n.find((x) => x.id === e.id).remarks = ev.target.value;
                    saveSet({ ...appSettings, employees: n });
                  }}
                  className={`w-full text-xs p-2 rounded border-none focus:ring-1 focus:ring-blue-200 ${
                    isDark ? "bg-slate-700" : "bg-gray-100"
                  }`}
                />

                <div
                  id={`payslip-${e.id}`}
                  className="hidden absolute top-0 left-0 w-[350px] bg-white p-6 border text-gray-800 z-[-1]"
                >
                  <div className="text-center text-xl font-bold border-b-2 border-black pb-4 mb-4">
                    급여 명세서
                  </div>
                  <div className="text-right text-xs text-gray-500 mb-4">
                    지급 예정일: {payslipStats.payDateStr} (일)
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold">성 명</span>
                    <span>{e.name}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="font-bold">기간</span>
                    <span className="text-xs">{payslipStats.period}</span>
                  </div>
                  <table className="w-full text-sm border-t border-b mb-4">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">
                          기본급여 ({payslipStats.emps[e.id]?.hours.toFixed(1)}
                          h)
                        </td>
                        <td className="text-right">
                          {fmt(payslipStats.emps[e.id]?.pay)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">인센티브</td>
                        <td className="text-right">
                          {fmt(payslipStats.emps[e.id]?.inc || 0)}
                        </td>
                      </tr>
                      <tr className="border-b font-bold text-gray-600">
                        <td className="py-2">과세 대상 합계</td>
                        <td className="text-right">
                          {fmt(
                            (payslipStats.emps[e.id]?.pay || 0) +
                              (payslipStats.emps[e.id]?.inc || 0)
                          )}
                        </td>
                      </tr>
                      <tr className="border-b text-red-500">
                        <td className="py-2">세금 공제 (3.3%)</td>
                        <td className="text-right">
                          -
                          {fmt(
                            e.useTax
                              ? ((payslipStats.emps[e.id]?.pay || 0) +
                                  (payslipStats.emps[e.id]?.inc || 0)) *
                                  0.033
                              : 0
                          )}
                        </td>
                      </tr>
                      <tr className="border-b text-blue-600">
                        <td className="py-2 font-bold">교통비/수당 (비과세)</td>
                        <td className="text-right font-bold">
                          {fmt(payslipStats.emps[e.id]?.transportPay || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="flex justify-between text-lg font-bold border-t border-black pt-4 mt-2">
                    <span>실 수령액</span>
                    <span>
                      {fmt(
                        ((payslipStats.emps[e.id]?.pay || 0) +
                          (payslipStats.emps[e.id]?.inc || 0)) *
                          (e.useTax ? 0.967 : 1) +
                          (payslipStats.emps[e.id]?.transportPay || 0)
                      )}
                    </span>
                  </div>
                  <div className="text-center text-xs text-gray-400 mt-8">
                    귀하의 노고에 감사드립니다.
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() =>
                saveSet({
                  ...appSettings,
                  employees: [
                    ...appSettings.employees,
                    {
                      id: Date.now(),
                      name: "",
                      hourlyRate: 0,
                      incentiveRate: 0,
                      transportFee: 10000,
                      useTax: false,
                    },
                  ],
                })
              }
              className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-400 font-bold mt-2 hover:bg-blue-50 transition-colors"
            >
              + 새 직원 등록하기
            </button>
          </div>
        )}

        {tab === "settings" && (
          <div
            className={`${cardBg} p-4 rounded-xl shadow space-y-6 animate-in fade-in`}
          >
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Settings size={20} /> 데이터 관리 & 설정
            </h2>

            {/* Dark Mode Toggle */}
            <div
              className={`p-4 rounded-xl border flex justify-between items-center ${
                isDark
                  ? "bg-slate-700 border-slate-600"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {isDark ? (
                  <Moon size={18} className="text-indigo-300" />
                ) : (
                  <Sun size={18} className="text-orange-400" />
                )}
                <span className="font-bold text-sm">다크 모드</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={appSettings.isDark || false}
                  onChange={(e) =>
                    saveSet({ ...appSettings, isDark: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 2. Fixed Costs (Equal Ratio) */}
            {/* Fix 7: Adjusted layout for Fixed Cost name input */}
            <div
              className={`p-5 rounded-2xl border shadow-sm ${
                isDark
                  ? "bg-slate-700 border-slate-600"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <CreditCard size={18} className="text-indigo-500" /> 고정 지출
                  관리
                </h3>
                <span className="text-xs opacity-50 bg-gray-500/10 px-2 py-1 rounded">
                  월간 정산용
                </span>
              </div>

              <div className="space-y-3 mb-4">
                {(appSettings.fixedCosts || []).length === 0 ? (
                  <div className="text-center text-xs opacity-40 py-2">
                    등록된 고정 지출이 없습니다.
                  </div>
                ) : (
                  (appSettings.fixedCosts || []).map((fc) => (
                    <div
                      key={fc.id}
                      className={`flex justify-between items-center p-3 rounded-xl border group transition-all ${
                        isDark
                          ? "bg-slate-800 border-slate-600"
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      <span className="font-bold opacity-80">{fc.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-indigo-500">
                          {fmt(fc.amount)}
                        </span>
                        <DeleteBtn
                          onClick={() =>
                            saveSet({
                              ...appSettings,
                              fixedCosts: appSettings.fixedCosts.filter(
                                (x) => x.id !== fc.id
                              ),
                            })
                          }
                          isDark={isDark}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div
                className={`flex flex-col gap-2 p-2 rounded-xl border ${
                  isDark
                    ? "bg-slate-800 border-slate-600"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <div className="flex gap-2">
                  <input
                    placeholder="항목명 (예: 월세)"
                    value={fcInput.name}
                    onChange={(e) =>
                      setFcInput({ ...fcInput, name: e.target.value })
                    }
                    className="bg-transparent border-none p-2 text-sm flex-1 outline-none w-full"
                  />
                </div>
                <div className="flex gap-2 border-t border-gray-200/10 pt-2">
                  <input
                    type="number"
                    placeholder="금액"
                    value={fcInput.amount}
                    onChange={(e) =>
                      setFcInput({ ...fcInput, amount: e.target.value })
                    }
                    className="bg-transparent border-none p-2 text-sm flex-1 text-right outline-none w-full"
                  />
                  <button
                    onClick={() => {
                      if (!fcInput.name || !fcInput.amount) return;
                      saveSet({
                        ...appSettings,
                        fixedCosts: [
                          ...(appSettings.fixedCosts || []),
                          {
                            id: Date.now(),
                            name: fcInput.name,
                            amount: parseInt(fcInput.amount),
                          },
                        ],
                      });
                      setFcInput({ name: "", amount: "" });
                    }}
                    className="bg-indigo-500 text-white px-4 rounded-lg text-sm font-bold hover:bg-indigo-600 transition-colors whitespace-nowrap"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>

            {/* Auth Section */}
            <div
              className={`p-4 rounded-lg border ${
                isDark
                  ? "bg-green-900/20 border-green-800"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <h3 className="font-bold mb-2 flex items-center gap-2 text-green-600">
                <Shield size={16} /> 계정 연결됨
              </h3>
              <div className="text-sm">
                <p className="mb-2">
                  현재 매장:{" "}
                  <span className="font-bold text-lg">{storeId}</span>
                </p>
                <p className="text-xs opacity-70 mb-3">
                  데이터가 클라우드에 안전하게 저장되고 있습니다.
                </p>
                {!logoutConfirm ? (
                  <button
                    onClick={() => setLogoutConfirm(true)}
                    className={`text-xs border px-3 py-2 rounded flex items-center gap-1 ${
                      isDark
                        ? "bg-slate-800 border-slate-600 text-red-400"
                        : "bg-white border-red-200 text-red-600"
                    }`}
                  >
                    {" "}
                    <LogOut size={12} /> 연결 해제 (로그아웃){" "}
                  </button>
                ) : (
                  <div
                    className={`flex flex-col gap-2 mt-2 p-2 rounded border animate-in fade-in ${
                      isDark
                        ? "bg-slate-800 border-slate-600"
                        : "bg-white border-red-200"
                    }`}
                  >
                    {" "}
                    <span className="text-xs font-bold text-red-500">
                      정말 로그아웃 하시겠습니까?
                    </span>{" "}
                    <div className="flex gap-2">
                      {" "}
                      <button
                        onClick={handleLogout}
                        className="flex-1 bg-red-500 text-white text-xs py-1.5 rounded font-bold hover:bg-red-600"
                      >
                        예, 로그아웃
                      </button>{" "}
                      <button
                        onClick={() => setLogoutConfirm(false)}
                        className={`flex-1 text-xs py-1.5 rounded hover:opacity-80 ${
                          isDark
                            ? "bg-slate-600 text-slate-300"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        취소
                      </button>{" "}
                    </div>{" "}
                  </div>
                )}
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                isDark
                  ? "bg-blue-900/20 border-blue-800"
                  : "bg-blue-50 border-blue-100"
              }`}
            >
              {" "}
              <h3 className="font-bold text-blue-500 mb-2 flex items-center gap-2">
                <Download size={16} /> 백업 (파일 저장)
              </h3>{" "}
              <div className="grid grid-cols-2 gap-2">
                {" "}
                <button
                  onClick={handleFileBackup}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-sm font-bold flex items-center justify-center gap-1"
                >
                  <FileJson size={14} /> 파일 저장
                </button>{" "}
                <button
                  onClick={handleClipboardBackup}
                  className={`w-full border py-2 rounded text-sm font-bold flex items-center justify-center gap-1 ${
                    isDark
                      ? "bg-slate-800 border-slate-600 text-blue-400"
                      : "bg-white border-blue-300 text-blue-600"
                  }`}
                >
                  <Copy size={14} /> 텍스트 복사
                </button>{" "}
              </div>{" "}
              {backupText && (
                <div className="mt-2">
                  <textarea
                    readOnly
                    value={backupText}
                    className={`w-full h-20 text-[10px] border rounded p-1 ${
                      isDark
                        ? "bg-slate-800 border-slate-600 text-slate-400"
                        : "bg-gray-50"
                    }`}
                    onClick={(e) => e.target.select()}
                  />
                </div>
              )}{" "}
            </div>
            <div
              className={`p-4 rounded-lg border ${
                isDark
                  ? "bg-red-900/20 border-red-800"
                  : "bg-red-50 border-red-100"
              }`}
            >
              {" "}
              <h3 className="font-bold text-red-500 mb-2 flex items-center gap-2">
                <Upload size={16} /> 복원 (파일 불러오기)
              </h3>{" "}
              <p className="text-xs opacity-60 mb-2">
                파일 선택이 안되면 백업 텍스트를 아래에 붙여넣고 복원 버튼을
                누르세요.
              </p>{" "}
              <div className="flex flex-col gap-2">
                {" "}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileRestore}
                  className="hidden"
                  accept=".json"
                />{" "}
                <button
                  onClick={() => fileInputRef.current.click()}
                  className={`w-full border py-2 rounded text-sm font-bold ${
                    isDark
                      ? "bg-slate-800 border-red-800 text-red-400"
                      : "bg-white border-red-300 text-red-500"
                  }`}
                >
                  📂 백업 파일 선택
                </button>{" "}
                <div className="flex gap-2 mt-2">
                  {" "}
                  <textarea
                    placeholder='{"settings":...} 붙여넣기'
                    value={restoreText}
                    onChange={(e) => setRestoreText(e.target.value)}
                    className={`flex-1 h-10 text-[10px] border rounded p-1 ${
                      isDark
                        ? "bg-slate-800 border-slate-600 text-white"
                        : "bg-white"
                    }`}
                  />{" "}
                  <button
                    onClick={() => processRestore(restoreText)}
                    className="bg-red-500 text-white px-3 rounded text-sm font-bold"
                  >
                    복원
                  </button>{" "}
                </div>{" "}
              </div>{" "}
            </div>
          </div>
        )}
      </main>

      <nav
        className={`fixed bottom-0 w-full backdrop-blur-lg border-t flex justify-around p-3 pb-5 text-[10px] font-bold max-w-3xl z-30 overflow-x-auto scrollbar-hide rounded-t-3xl transition-colors ${
          isDark
            ? "bg-slate-900/90 border-slate-800 text-slate-500"
            : "bg-white/90 border-gray-200 text-gray-400"
        }`}
      >
        {[
          ["home", Home, "홈"],
          ["calendar", CalendarIcon, "달력"],
          ["schedule", Clock, "스케줄"],
          ["daily", Edit2, "입력"],
          ["report", BarChart3, "정산"],
          ["crm", Heart, "단골"],
          ["inventory", Package, "재고"],
          ["employees", User, "직원"],
          ["settings", Settings, "설정"],
        ].map(([k, I, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex flex-col items-center min-w-[48px] transition-all ${
              tab === k
                ? isDark
                  ? "text-indigo-400 scale-110"
                  : "text-indigo-600 scale-110"
                : "hover:opacity-80"
            }`}
          >
            <I size={22} strokeWidth={tab === k ? 2.5 : 2} />
            <span className="mt-1">{l}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
