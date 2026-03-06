
export default async function handler(req: any, res: any) {
  const { q } = req.query;
  // 환경 변수가 없으면 하드코딩된 키(백업)를 사용합니다.
  const apiKey = process.env.NIKL_API_KEY || "ib7QOuGBin71GxPmFTxyUtQNhzrjgu";

  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }
  
  try {
    const queryStr = String(q || '');
    // 한글 포함 여부 확인 (한글 자모 및 음절 범위)
    const isKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(queryStr);
    const searchCondition = isKorean ? 'korean_mark' : 'srclang_mark';

    const url = `https://korean.go.kr/kornorms/exampleReqList.do?serviceKey=${apiKey}&searchCondition=${searchCondition}&searchKeyword=${encodeURIComponent(queryStr)}&pageNo=1&numOfRows=10&langType=0003&resultType=json`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Upstream API failed with status: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('NIKL API Error:', error);
    res.status(500).json({ error: "Failed to fetch data from NIKL API", details: String(error) });
  }
}
