
import { StyleRule, ChecklistItem } from './types';

export const VOCABULARY_RULES: StyleRule[] = [
  { id: 'v1', category: 'vocabulary', wrong: '괴상망칙', correct: '괴상망측' },
  { id: 'v2', category: 'vocabulary', wrong: '귀뜸', correct: '귀띔' },
  { id: 'v3', category: 'vocabulary', wrong: '나르시즘', correct: '나르시시즘' },
  { id: 'v4', category: 'vocabulary', wrong: '돗데기시장', correct: '도떼기시장' },
  { id: 'v5', category: 'vocabulary', wrong: '발뼘', correct: '발뺌' },
  { id: 'v6', category: 'vocabulary', wrong: '부항', correct: '부항' },
  { id: 'v7', category: 'vocabulary', wrong: '붓기', correct: '부기' },
  { id: 'v8', category: 'vocabulary', wrong: '시덥다', correct: '시답다' },
  { id: 'v9', category: 'vocabulary', wrong: '어지러움', correct: '어지럼' },
  { id: 'v10', category: 'vocabulary', wrong: '횡경막', correct: '횡격막' },
  { id: 'v11', category: 'vocabulary', wrong: '부비다', correct: '비비다' },
];

export const SIMILAR_WORDS: StyleRule[] = [
  { id: 's1', category: 'vocabulary', wrong: '각출', correct: '갹출', description: '각출은 각자 몫을 냄, 갹출은 공동의 몫을 여럿이 나누어 냄' },
  { id: 's2', category: 'vocabulary', wrong: '구분', correct: '구별', description: '구분은 기준에 따라 나눔(A와 B), 구별은 차이에 따라 나눔(A와 B를)' },
  { id: 's3', category: 'vocabulary', wrong: '비중', correct: '비율', description: '비중은 중요도, 비율은 수량의 정도(수치화 가능)' },
  { id: 's4', category: 'vocabulary', wrong: '승전고', correct: '승전보', description: '승전고는 북 소리, 승전보는 이긴 경과 기록' },
  { id: 's5', category: 'vocabulary', wrong: '자처', correct: '자청', description: '자처는 자기를 ~로 여김, 자청은 스스로 나서기를 청함' },
  { id: 's6', category: 'vocabulary', wrong: '햇빛', correct: '햇볕', description: '햇빛은 해의 빛(시각), 햇볕은 내리쬐는 기운(촉각)' },
  { id: 's7', category: 'vocabulary', wrong: '희귀병', correct: '희소병', description: '병이 귀하다는 말은 부적절함' },
  { id: 's8', category: 'vocabulary', wrong: '선친', correct: '부친', description: '선친은 남에게 말하는 자신의 돌아가신 아버지' },
  { id: 's9', category: 'vocabulary', wrong: '회자', correct: '오르내림', description: '회자는 칭찬받으며 자주 언급됨(긍정)' },
];

export const TRANSLATIONESE: StyleRule[] = [
  { id: 't1', category: 'style', wrong: '~와의', correct: '~와 벌인/치른', example: '첼시와의 경기 -> 첼시와 벌인 경기' },
  { id: 't2', category: 'style', wrong: '~에 대해', correct: '~에게/~를 대상으로', example: 'A씨에 대해 무죄 -> A씨에게 무죄' },
  { id: 't3', category: 'style', wrong: '~에 의해', correct: '~에/~가 실시한', example: '우크라이나 동부 지역이 러시아군에 의해 점령됐다 -> 러시아군에 점령됐다' },
  { id: 't4', category: 'style', wrong: '~으로 인해', correct: '~때문에/~로', example: '코로나로 인해 -> 코로나로' },
  { id: 't5', category: 'style', wrong: '~을 통해', correct: '~에서/~로', example: '트위터를 통해 -> 트위터에서' },
  { id: 't6', category: 'style', wrong: '~하기 위해', correct: '~하려고/~하고자', example: '늘리기 위해 -> 늘리려고' },
  { id: 't7', category: 'style', wrong: '가진다', correct: '한다/열다', example: '회담을 가진다 -> 회담을 한다' },
  { id: 't8', category: 'style', wrong: '위치하다', correct: '있다', example: '한강 변에 위치해 -> 한강 변에 있어' },
  { id: 't9', category: 'style', wrong: '다름 아니다', correct: '다름없다', example: '선전포고에 다름 아니다 -> 선전포고나 다름없다' },
];

export const NUMERICAL_RULES: StyleRule[] = [
  { id: 'n1', category: 'style', wrong: '10만원에서 30만원으로 3배가 오름', correct: '2배가 오름 / 3배로 오름', description: '차액 기준은 "가"를 써서 2배, 최종치 기준은 "로"를 써서 3배' },
  { id: 'n2', category: 'style', wrong: '50%에서 60%로 10% 높아짐', correct: '10%포인트 높아짐', description: '백분율의 단순 차이는 %포인트(p)를 사용' },
];

export const LOANWORD_RULES_CHOSUN: StyleRule[] = [
  { id: 'l1', category: 'loanword', wrong: '레오나르도 디카프리오', correct: '리어나도 디캐프리오', description: '조선일보 원지음 원칙' },
  { id: 'l2', category: 'loanword', wrong: '아웅산 수치', correct: '아웅산 수지' },
  { id: 'l3', category: 'loanword', wrong: '슈퍼', correct: '수퍼', description: '조선일보 예외적 관용 표기 (슈퍼마켓 -> 수퍼마켓)' },
  { id: 'l4', category: 'loanword', wrong: '조지프', correct: '조셉', description: '조선일보 예외적 관용 표기' },
  { id: 'l5', category: 'loanword', wrong: '솔루션', correct: '설루션', description: '조선일보 스타일북 지정 표기' },
  { id: 'l6', category: 'loanword', wrong: '데크', correct: '덱', description: '조선일보 스타일북 지정 표기' },
  { id: 'l7', category: 'loanword', wrong: '탑', correct: '톱', description: '조선일보 스타일북 지정 표기 (루프탑 -> 루프톱)' },
  { id: 'l8', category: 'loanword', wrong: '맥도날드', correct: '맥도널드', description: '글로벌 본사 지칭 시 맥도널드 (한국지사는 맥도날드)' },
  { id: 'l9', category: 'loanword', wrong: '토요타', correct: '도요타', description: '글로벌 본사 지칭 시 도요타 (한국지사는 토요타)' },
  { id: 'l10', category: 'loanword', wrong: '휴렛팩커드', correct: '휼렛패커드', description: '조선일보 스타일북 지정 표기' },
  { id: 'l11', category: 'loanword', wrong: '크로와상', correct: '크루아상', description: '조선일보 스타일북 지정 표기' },
  { id: 'l12', category: 'loanword', wrong: '피규어', correct: '피겨', description: '조선일보 스타일북 지정 표기' },
  { id: 'l13', category: 'loanword', wrong: '화이팅', correct: '파이팅' },
  { id: 'l14', category: 'loanword', wrong: '악세사리', correct: '액세서리' },
  { id: 'l15', category: 'loanword', wrong: '컨퍼런스', correct: '콘퍼런스' },
  { id: 'l16', category: 'loanword', wrong: '할로윈', correct: '핼러윈' },
  { id: 'l17', category: 'loanword', wrong: '샤인머스켓', correct: '샤인 머스캣' },
];

export const CHECKLIST: ChecklistItem[] = [
  { id: 'c1', category: '사실관계', task: '제목과 본문 내용이 일치하는가?' },
  { id: 'c2', category: '사실관계', task: '본문과 그래픽 간 내용이 일치하는가?' },
  { id: 'c3', category: '사실관계', task: '사진 설명과 본문/사진 내용이 일치하는가?' },
  { id: 'c4', category: '사실관계', task: '상식선에서 틀리는 내용이 없는가?' },
  { id: 'c5', category: '글', task: '주제에서 벗어나거나 불필요한 중복은 없는가?' },
  { id: 'c6', category: '문장', task: '문장 성분이 호응하는가? (주어-서술어)' },
  { id: 'c7', category: '문장', task: '번역투 표현이나 군더더기(것, 의, 들)는 없는가?' },
  { id: 'c8', category: '단어', task: '오탈자가 없는가? (한자 병기 확인)' },
  { id: 'c9', category: '맞춤법', task: '조선일보 외래어 표기 원칙을 준수했는가?' },
];

export const LOANWORD_RULES_ENG = [
  { title: '무성 파열음 [p, t, k]', rule: '짧은 모음 다음 어말 [p, t, k]는 받침으로 적는다.', examples: 'zip line -> 집 라인, squat -> 스쾃, deck -> 덱' },
  { title: '유성 파열음 [b, d, g]', rule: '어말과 모든 자음 앞 유성 파열음은 \'으\'를 붙여 적는다.', examples: 'sub -> 서브, bed -> 베드, hot dog -> 핫도그' },
  { title: '마찰음 [ʃ]', rule: '어말이나 i 앞의 [ʃ]는 \'시\'로 적는다.', examples: 'cash -> 캐시, shift -> 시프트' },
  { title: '이중모음 [ou]', rule: '\'오우\'가 아니라 \'오\'로 적는다.', examples: 'window -> 윈도, follower -> 팔로어' },
  { title: '마찰음 [f]', rule: '\'ㅎ\'이 아니라 \'ㅍ\'으로 적는다.', examples: 'fighting -> 파이팅, fitness -> 피트니스' },
  { title: '어말 [z]', rule: '즈가 아니라 \'스\'로 적는다.', examples: 'Beatles -> 비틀스, masters -> 마스터스' },
];
