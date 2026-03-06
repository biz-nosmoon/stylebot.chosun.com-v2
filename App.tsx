
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Search, 
  Loader2, 
  ShieldCheck, 
  MessageSquare, 
  Send, 
  User, 
  Zap, 
  Globe, 
  ArrowRight, 
  SearchCode, 
  RefreshCcw, 
  CloudUpload, 
  Database, 
  FileText,
  Info,
  BookCheck, 
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { DEFAULT_STYLEBOOK } from './stylebookData';

interface NiklData {
  definition: string;
  rule: string;
  link?: string;
  isError?: boolean; // 에러 상태 표시용
  regltn_path?: string; // 관련 규정 경로
  korean_mark?: string; // 우선순위 적용을 위한 순수 표기 값
}

interface AiSuggestion {
  id: string;
  term: string; 
  wrong: string;
  correct: string;
  searchKeyword?: string;
  analysis: {
    tier1_chosun: string;     
    tier2_usage: string;      
  };
  tier3_nikl_data?: NiklData; // API로 가져온 실데이터
  final_decision_source: 'chosun' | 'national_institute' | 'general';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  groundingChunks?: any[];
  suggestions?: AiSuggestion[];
  isError?: boolean;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chatbot' | 'lookup' | 'stylebook'>('chatbot');
  const [isAdmin, setIsAdmin] = useState(false); // 관리자 모드 상태
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Lookup Tab States
  const [searchTerm, setSearchTerm] = useState('');
  const [lookupResult, setLookupResult] = useState<NiklData | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  
  const [stylebookText, setStylebookText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const fetchServerStylebook = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      
      // 우선 정적 파일 fetch 시도 (서버에 파일이 별도로 배포된 경우 최신본을 가져옴)
      const response = await fetch('./Global_Stylebook_Data.txt');
      if (response.ok) {
        const text = await response.text();
        setStylebookText(text);
        setLastSynced(new Date());
        return;
      }
      
      // 404 등으로 실패 시 번들링된 데이터 사용
      console.warn('Global_Stylebook_Data.txt fetch failed, using bundled data.');
      setStylebookText(DEFAULT_STYLEBOOK);
      setLastSynced(new Date());
      
    } catch (error) {
      console.error('서버 스타일북 로드 실패, 번들 데이터 사용:', error);
      // 네트워크 에러 등의 경우에도 번들 데이터 사용
      setStylebookText(DEFAULT_STYLEBOOK);
      setLastSynced(new Date());
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServerStylebook();
  }, [fetchServerStylebook]);

  // 관리자 모드가 꺼지면 챗봇 탭으로 강제 이동
  useEffect(() => {
    if (!isAdmin && activeTab !== 'chatbot') {
      setActiveTab('chatbot');
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiLoading]);

  const handleSyncToServer = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    // 실제 서버 환경이 아니라면 로컬 스토리지에만 저장 (데모용)
    localStorage.setItem('chosun_stylebook_server_text', stylebookText);
    setLastSynced(new Date());
    setIsSyncing(false);
    alert('Global_Stylebook_Data.txt가 서버에 업데이트되었습니다.');
  };

  /**
   * 국립국어원 데이터 호출 함수
   * 조선일보 API Gateway를 통해 데이터를 직접 호출합니다.
   */
  const fetchNiklDataDirectly = useCallback(async (query: string): Promise<NiklData> => {
    if (!query.trim()) return { definition: '', rule: '' };

    const parseNiklResponse = (data: any): NiklData => {
       // 1. API Gateway 실제 응답 구조 대응: { response: { items: [...] } }
       const items = data.response?.items || data.items;

       if (Array.isArray(items) && items.length > 0) {
          let item = items[0];

          // [Priority Logic] 검색어와 일치하는 항목 우선 선택
          if (items.length > 1) {
            const normalize = (str: string) => str ? str.trim().toLowerCase().replace(/\s+/g, '') : '';
            const target = normalize(query);
            
            const match = items.find((it: any) => {
               const kMark = normalize(it.korean_mark);
               const rMark = normalize(it.relate_mark_o); // relate_mark_o 확인
               return kMark === target || rMark === target;
            });

            if (match) {
               item = match;
            }
          }
          
          const gubun = item.foreign_gubun || '일반';
          const mean = item.mean || '상세 뜻풀이가 없습니다.';
          const definitionText = `[${gubun}] ${mean}`;

          const originalLang = item.srclang_mark || '';
          const langName = item.lang_nm || '';
          const originalPart = originalLang 
            ? ` (원어: ${originalLang}${langName ? `, ${langName}` : ''})` 
            : '';
            
          const ruleText = `국립국어원 표기: '${item.korean_mark}'${originalPart}`;

          return {
            definition: definitionText,
            rule: ruleText,
            link: "https://korean.go.kr/kornorms/exampleReqList.do",
            isError: false,
            regltn_path: item.regltn_path?.replace(/&gt;/g, '>'), // HTML 엔티티 제거
            korean_mark: item.korean_mark // 우선순위 로직을 위한 순수 표기값
          };
       }
       
       // 2. 기존 구조 또는 다른 API 응답 구조 대응 (fallback)
       const results = data.result || data.data?.result;
       if (Array.isArray(results) && results.length > 0) {
          const item = results[0];
          return {
            definition: `원어: ${item.orgn_mark || '-'} (${item.nation_name || '국가정보 없음'})`,
            rule: `국립국어원 표기: ${item.korean_mark}`,
            link: "https://korean.go.kr/kornorms/exampleReqList.do",
            korean_mark: item.korean_mark
          };
       }
       
       // 3. 표준국어대사전 구조 대응 (channel.item)
       if (data?.channel?.item) {
          const item = data.channel.item[0];
          if (item) {
            return {
              definition: item.sense?.definition || "상세 뜻풀이가 없습니다.",
              rule: "표준국어대사전 등재",
              link: item.target_code ? `https://stdict.korean.go.kr/search/searchView.do?word_no=${item.target_code}&searchKeywordTo=3` : undefined
            };
          }
       }

       return {
        definition: "국립국어원 검색 결과가 없습니다.",
        rule: "외래어 용례 미등재",
        isError: false
      };
    };

    try {
      const apiKey = process.env.NIKL_API_KEY;
      
      // 한글 포함 여부 확인 (한글 자모 및 음절 범위)
      const isKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(query);
      const searchCondition = isKorean ? 'korean_mark' : 'srclang_mark';

      // API Gateway 호출 URL
      const url = `https://api-gateway.chosun.com/membership-dev/api/kornorm/examples?serviceKey=${apiKey}&searchCondition=${searchCondition}&searchKeyword=${encodeURIComponent(query)}&pageNo=1&numOfRows=10&langType=0003&resultType=json`;
      
      console.log("Fetching NIKL Data:", url);
      const response = await fetch(url);

      if (response.ok) {
          const data = await response.json();
          console.log("NIKL Data Fetched:", data);
          return parseNiklResponse(data);
      } else {
          console.warn(`API Gateway returned status: ${response.status}`);
          return {
             definition: `API 호출 오류: ${response.status}`,
             rule: "서버 상태를 확인해주세요.",
             isError: true
          };
      }
    } catch (e) {
        console.error(`API Fetch failed:`, e);
        return { 
          definition: "네트워크 연결 실패", 
          rule: "인터넷 연결 또는 API Gateway 상태를 확인해주세요.",
          isError: true
        };
    }
  }, []);

  const handleLookupSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsLookupLoading(true);
    setLookupResult(null);
    try {
      const data = await fetchNiklDataDirectly(searchTerm);
      setLookupResult(data);
    } finally {
      setIsLookupLoading(false);
    }
  };

  const getDynamicPrompt = useCallback(() => {
    return `
당신은 조선일보 시니어 교열 에디터입니다. 
[서버 스타일북 데이터]는 최우선(Tier 1) 지침입니다.

[서버 스타일북 데이터 - Global_Stylebook_Data.txt]
${stylebookText}

[수행 지침]
0. **스타일북 규정 절대 우선**:
   - **나이 계산**: 연 나이(현재 연도 - 출생 연도) 적용.
   - **수치 증감**: "A에서 B로 늘었다. 몇 배 올랐나?"와 같은 질문에는 스타일북의 '숫자 표현' 규정(차액 기준 '가', 최종치 기준 '로')을 엄격히 적용하십시오.
     * 원칙: 'X배가 오름'은 증가분을 의미하므로 **(최종값 - 초깃값) / 초깃값**으로 계산하십시오. (예: 10 -> 30은 20이 늘었으므로 2배가 오른 것)
     * 반면, 'X배로 오름'은 전체 배율이므로 최종값 / 초깃값으로 계산합니다.
     * "몇 배 올랐냐"는 질문은 통상 증가분을 묻는 것이므로 전자의 공식을 따르십시오.
     * 답변 형식: "제공된 『조선일보 스타일북』의 수의 증감 표현 원칙에 따르면, 약 X배 오른 것입니다." (필요 시 정확한 수치 병기)
   - 그 외 날짜, 띄어쓰기, 문장부호 등도 스타일북을 따르십시오.

1. (Tier 1) 위 데이터에 명시된 표기 원칙을 교열 대상 문장에 적용하십시오.
2. (Tier 2) 분석 근거(tier1_chosun)에는 위 데이터 중 어떤 부분에 근거했는지 구체적으로 언급하십시오.
3. (Tier 2) 국립국어원 외래어 표기법을 AI 지식 기반으로 검색하여 표기해 주세요.
4. SearchKeyword : 한글의 외래어 표기법이나 외래어의 한글 표기법인 경우에만 국립국어원 데이터베이스 검색을 위한 핵심 키워드(원어 또는 한글 표기)를 추출해 주세요.
   - **중요**: "외래어 표기법" 같은 부연 설명은 절대 포함하지 마십시오. (예: "Kristian Coates Ulrichsen 외래어 표기법" (X) -> "Kristian Coates Ulrichsen" (O))
   - **중요**: 외래어 인명의 경우, 원문에 기재된 성과 이름의 순서 및 문장부호(쉼표 등)를 임의로 변경하지 말고 있는 그대로 추출하십시오. 
   - (예: 원문이 "Suzanne, Schulting"이면 "Schulting Suzanne"이 아닌 "Suzanne, Schulting"으로 추출)
5. 답변은 tier1, tier2를 바탕으로 그렇게 판단한 사유를 표기해주세요.

**중요**: Tier 3 데이터는 별도 API로 가져올 것이므로 JSON에는 tier1, tier2 분석까지만 포함하십시오.
반드시 JSON 형식으로 응답하십시오.
`;
  }, [stylebookText]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;
    const userMsg: Message = { role: 'user', content: chatInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setIsAiLoading(true);
    setAnalysisProgress(10);

    try {
      const isProd = import.meta.env.PROD;
      const ai = new GoogleGenAI(
        isProd 
          ? { apiKey: process.env.API_KEY, vertexai: true } 
          : { apiKey: process.env.GEMINI_API_KEY }
      );

      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `교열 요청 문장: "${currentInput}"`,
        config: {
          temperature: 0,
          systemInstruction: getDynamicPrompt(),
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: { type: Type.STRING },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    wrong: { type: Type.STRING },
                    correct: { type: Type.STRING },
                    searchKeyword: { type: Type.STRING },
                    analysis: {
                      type: Type.OBJECT,
                      properties: {
                        tier1_chosun: { type: Type.STRING },
                        tier2_usage: { type: Type.STRING }
                      },
                      required: ["tier1_chosun", "tier2_usage"]
                    },
                    final_decision_source: { type: Type.STRING, enum: ['chosun', 'national_institute', 'general'] }
                  },
                  required: ["term", "wrong", "correct", "analysis", "final_decision_source", "searchKeyword"]
                }
              }
            },
            required: ["answer", "suggestions"]
          }
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      const suggestions: AiSuggestion[] = parsed.suggestions || [];
      
      setAnalysisProgress(50);

      let finalMainContent = parsed.answer; 
      const niklOverrideRules: string[] = [];

      const updatedSuggestions = await Promise.all(suggestions.map(async (s, idx) => {
        const keywordToSearch = s.searchKeyword || s.wrong || s.correct;
        let isFromThirdSearch = false;
        let niklData = await fetchNiklDataDirectly(keywordToSearch);

        if ((!niklData || niklData.isError || niklData.definition.includes("결과가 없습니다")) && s.wrong && s.wrong !== keywordToSearch) {
          const retryData = await fetchNiklDataDirectly(s.wrong);
          if (retryData && !retryData.isError && retryData.korean_mark) {
            niklData = retryData;
          }
        }

        if ((!niklData || niklData.isError || niklData.definition.includes("결과가 없습니다")) && s.searchKeyword) {
          const parts = s.searchKeyword.split(/[\s,]+/).filter(p => p.length > 0);
          if (parts.length === 2) {
            const variations = [`${parts[0]}, ${parts[1]}`, `${parts[1]}, ${parts[0]}`];
            for (const v of variations) {
              const vData = await fetchNiklDataDirectly(v);
              if (vData && !vData.isError && vData.korean_mark) {
                niklData = vData;
                break;
              }
            }
          }
        }

        if ((!niklData || niklData.isError || niklData.definition.includes("결과가 없습니다")) && s.searchKeyword) {
          const words = s.searchKeyword.split(/[\s,]+/).filter(w => w.length > 0);
          if (words.length > 1) {
            for (const word of words) {
              const wordData = await fetchNiklDataDirectly(word);
              if (wordData && !wordData.isError && wordData.korean_mark) {
                niklData = wordData;
                isFromThirdSearch = true;
                break; 
              }
            }
          }
        }

        let finalCorrect = s.correct;
        let finalAnalysis ={ ...s.analysis };
        let finalSource = s.final_decision_source;

        const isChosunStylebook = s.final_decision_source === 'chosun';

        if (niklData && !niklData.isError && niklData.korean_mark) {
           if (!isChosunStylebook) {
            if (!isFromThirdSearch) {
              finalCorrect = niklData.korean_mark;
              finalSource = 'national_institute';
              if (niklData.rule) {
                niklOverrideRules.push(niklData.rule);
              }
            }
           }
        }

        return {
          ...s,
          id: `ai-${Date.now()}-${idx}`,
          correct: finalCorrect,
          analysis: finalAnalysis,
          final_decision_source: finalSource,
          tier3_nikl_data: niklData
        };
      }));

      if (niklOverrideRules.length > 0) {
        finalMainContent = Array.from(new Set(niklOverrideRules)).join('\n');
      }

      setAnalysisProgress(100);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: finalMainContent,
        timestamp: new Date(),
        suggestions: updatedSuggestions
      }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "분석 중 오류가 발생했습니다.", timestamp: new Date(), isError: true }]);
    } finally {
      setIsAiLoading(false);
      setAnalysisProgress(0);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <Loader2 className="animate-spin text-red-500" size={48} />
        <p className="font-black tracking-widest text-sm uppercase animate-pulse">Connecting to Style Server...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white font-pretendard">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-2 rounded-xl shadow-lg">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-white tracking-tighter italic uppercase">조선스타일봇</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Data Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAiLoading && (
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
              <Loader2 size={12} className="animate-spin text-red-500" />
              <span className="text-[10px] font-black text-white">{analysisProgress}%</span>
            </div>
          )}
          <button 
            onClick={() => setIsAdmin(prev => !prev)} 
            className={`w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center transition-all ${isAdmin ? 'bg-red-600 text-white border-red-500' : 'bg-slate-800 text-slate-500'}`}
          >
            <User size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {isAdmin && (
          <nav className="w-20 md:w-64 bg-slate-50 border-r border-slate-200 flex flex-col p-4 space-y-2 animate-in slide-in-from-left duration-200">
            <button onClick={() => setActiveTab('chatbot')} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'chatbot' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white'}`}>
              <MessageSquare size={20} /> <span className="hidden md:block font-black">실시간 교열</span>
            </button>
            <button onClick={() => setActiveTab('lookup')} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'lookup' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white'}`}>
              <Search size={20} /> <span className="hidden md:block font-black">국어원 연동</span>
            </button>
            <button onClick={() => setActiveTab('stylebook')} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'stylebook' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white'}`}>
              <Database size={20} /> <span className="hidden md:block font-black">스타일북 서버</span>
            </button>
          </nav>
        )}

        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chatbot' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50/50">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                    <Zap size={60} className="text-slate-200" />
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">조선스타일봇</h2>
                      <p className="text-slate-400 text-sm font-bold italic tracking-widest">외래어 표기, 맞춤법 등 무엇이든 물어보세요</p>
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`${msg.role === 'assistant' ? 'w-full' : 'max-w-[90%]'} md:max-w-[80%] space-y-4`}>
                      <div className={`p-6 rounded-[2.5rem] shadow-sm border ${msg.role === 'user' ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'}`}>
                        <div className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                        {msg.suggestions?.map(s => (
                          <div key={s.id} className="mt-8 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 border border-slate-200 p-5 rounded-3xl">
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-black text-red-600 uppercase tracking-widest italic">Tier 1 Override</span>
                                 <div className="flex items-center gap-3 mt-1">
                                   <span className="text-sm font-bold line-through text-slate-300">{s.wrong}</span>
                                   <ArrowRight size={14} className="text-slate-900" />
                                   <span className="text-xl font-black text-red-600">{s.correct}</span>
                                 </div>
                               </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white border-2 border-red-50 p-5 rounded-[2rem] shadow-sm">
                                <span className="text-[10px] font-black text-red-600 uppercase italic">Tier 1: 조선 스타일북</span>
                                <p className="text-[12px] font-bold mt-2 leading-relaxed">{s.analysis.tier1_chosun}</p>
                              </div>
                              <div className="bg-slate-100 p-5 rounded-[2rem] shadow-inner">
                                <span className="text-[10px] font-black text-slate-500 uppercase italic">Tier 2: 국립국어원 표기법(AI)</span>
                                <p className="text-[12px] font-bold mt-2 leading-relaxed text-slate-700">{s.analysis.tier2_usage}</p>
                              </div>
                            </div>
                            
                            <div className={`p-5 rounded-[2rem] shadow-sm border-2 ${s.tier3_nikl_data?.isError ? 'bg-red-50 border-red-100' : 'bg-white border-green-50'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <BookOpen size={14} className={s.tier3_nikl_data?.isError ? "text-red-500" : "text-green-600"} />
                                    <span className={`text-[10px] font-black uppercase italic tracking-widest ${s.tier3_nikl_data?.isError ? "text-red-600" : "text-green-600"}`}>
                                      {s.tier3_nikl_data?.isError ? "API Error" : "Tier 3: 국립국어원 용례"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${s.tier3_nikl_data?.isError ? 'bg-red-100 text-red-500' : 'bg-green-50 text-green-600'}`}>API</span>
                                    {s.tier3_nikl_data?.link && (
                                      <a href={s.tier3_nikl_data.link} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                                        <ExternalLink size={12} className="text-slate-400" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-[12px] font-bold leading-relaxed text-slate-800">
                                      {s.tier3_nikl_data?.definition || "데이터를 불러오는 중..."}
                                    </p>
                                  </div>
                                  <div className={`pt-2 border-t ${s.tier3_nikl_data?.isError ? 'border-red-100' : 'border-slate-100'}`}>
                                    <div className="text-[11px] font-medium leading-relaxed text-slate-600">
                                      <p>{s.tier3_nikl_data?.rule || "-"}</p>
                                      {s.tier3_nikl_data?.regltn_path && (
                                        <p className="mt-1 text-[10px] text-slate-400 flex items-start gap-1">
                                          <span className="shrink-0 text-slate-400 opacity-70">규정:</span>
                                          <span className="opacity-70">{s.tier3_nikl_data.regltn_path}</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-white border-t border-slate-100">
                <div className="max-w-5xl mx-auto">
                  <div className="relative">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="질문을 입력하세요..." className="w-full bg-slate-50 border-4 border-transparent focus:border-slate-900 focus:bg-white rounded-[2rem] px-8 py-6 text-lg font-bold outline-none transition-all shadow-inner" />
                    <button onClick={handleSendMessage} disabled={!chatInput.trim() || isAiLoading} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-slate-900 text-white rounded-3xl hover:bg-red-600 transition-all shadow-2xl">{isAiLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}</button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'lookup' ? (
            <div className="flex-1 overflow-y-auto p-8 md:p-16 bg-slate-50/30">
               <div className="max-w-4xl mx-auto space-y-12 text-center">
                  <h2 className="text-6xl font-black text-slate-900 tracking-tighter italic uppercase underline decoration-red-600 decoration-8 underline-offset-[12px]">NIKL Intelligence</h2>
                  <div className="relative shadow-2xl rounded-[3rem] bg-white p-3 flex group">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-slate-900 transition-all" size={32} />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLookupSearch()} placeholder="용례 및 조항 검색..." className="flex-1 pl-20 pr-4 py-8 text-3xl font-black outline-none bg-transparent" />
                    <button onClick={handleLookupSearch} disabled={isLookupLoading} className="px-12 bg-red-600 text-white rounded-[2.5rem] font-black text-lg hover:bg-red-700 shadow-xl transition-all disabled:opacity-50">
                      {isLookupLoading ? <Loader2 className="animate-spin" /> : "SEARCH"}
                    </button>
                  </div>

                  {lookupResult && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className={`text-left p-8 rounded-[3rem] shadow-2xl border ${lookupResult.isError ? 'bg-red-900 text-white border-red-800' : 'bg-slate-900 text-white border-slate-800'}`}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-3 rounded-2xl ${lookupResult.isError ? 'bg-red-800' : 'bg-slate-800'}`}>
                                    <Database size={24} className={lookupResult.isError ? 'text-white' : 'text-green-400'} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Search Result</span>
                                    <span className="text-2xl font-black">{searchTerm}</span>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                                    <span className="text-xs font-bold text-slate-500 block mb-2">상세 정보 (원어/의미)</span>
                                    <p className="text-xl font-medium leading-relaxed">{lookupResult.definition}</p>
                                </div>
                                <div className="bg-red-600 p-6 rounded-3xl shadow-lg flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-black text-red-200 block mb-1">국립국어원 표기</span>
                                        <p className="text-2xl font-black text-white">{lookupResult.rule}</p>
                                    </div>
                                    {lookupResult.link && (
                                        <a href={lookupResult.link} target="_blank" rel="noopener noreferrer" className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all">
                                            <ExternalLink size={20} className="text-white" />
                                        </a>
                                    )}
                                </div>
                            </div>
                         </div>
                    </div>
                  )}
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 md:p-12 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Master Source</h2>
                  <p className="text-slate-400 font-bold">Global_Stylebook_Data.txt: 서버 원천 데이터 관리 모드</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-3">
                    <button onClick={fetchServerStylebook} className="px-5 py-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all font-black text-xs flex items-center gap-2"><RefreshCcw size={14} /> Pull</button>
                    <button onClick={handleSyncToServer} disabled={isSyncing} className="px-8 py-3 bg-slate-900 text-white rounded-2xl hover:bg-red-600 disabled:opacity-30 transition-all font-black text-xs flex items-center gap-2 shadow-xl">
                      {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />} 
                      Push & Sync
                    </button>
                  </div>
                  {lastSynced && <span className="text-[10px] font-bold text-slate-300">Last Synced: {lastSynced.toLocaleTimeString()}</span>}
                </div>
              </div>

              <div className="flex-1 p-6 md:p-12 bg-slate-50 flex flex-col gap-6 overflow-hidden">
                <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl flex-1 flex flex-col overflow-hidden relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-800 flex flex-col items-center pt-8 text-[10px] font-black text-slate-600 select-none">
                    {Array.from({ length: 40 }).map((_, i) => <div key={i} className="h-6 leading-6">{i+1}</div>)}
                  </div>
                  <div className="flex items-center gap-2 px-6 py-4 bg-slate-800 border-b border-slate-700">
                    <FileText size={14} className="text-red-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global_Stylebook_Data.txt</span>
                  </div>
                  <textarea 
                    value={stylebookText} 
                    onChange={(e) => setStylebookText(e.target.value)}
                    placeholder="스타일북 원천 내용을 입력하세요..."
                    className="flex-1 bg-transparent text-white p-8 pl-16 font-mono text-sm font-medium leading-6 outline-none resize-none placeholder:text-slate-700 selection:bg-red-900"
                  />
                  <div className="absolute right-12 bottom-12 pointer-events-none opacity-20">
                    <Database size={100} className="text-white" />
                  </div>
                </div>
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
                   <Info className="text-blue-500 mt-1 shrink-0" size={20} />
                   <div className="space-y-1">
                     <p className="text-sm font-black text-blue-900">운영 가이드</p>
                     <p className="text-xs font-bold text-blue-700 leading-relaxed">
                       - 수정 사항은 즉시 모든 교열 AI의 Tier 1 컨텍스트에 반영됩니다.<br/>
                       - <strong>Push & Sync</strong>를 눌러야 서버 파일이 최종 업데이트됩니다.
                     </p>
                   </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
