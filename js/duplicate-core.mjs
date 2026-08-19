export function normalizeText(value=''){
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,' ')
    .trim()
    .replace(/\s+/g,' ');
}

export function tokenSet(value=''){
  const normalized=normalizeText(value);
  return new Set(normalized?normalized.split(' '):[]);
}

export function jaccard(left=[],right=[]){
  const a=new Set(left||[]),b=new Set(right||[]);
  if(!a.size&&!b.size)return 0;
  let intersection=0;
  for(const value of a)if(b.has(value))intersection++;
  const union=new Set([...a,...b]).size;
  return union?intersection/union:0;
}

export function nameSimilarity(left='',right=''){
  const a=normalizeText(left),b=normalizeText(right);
  if(!a||!b)return 0;
  if(a===b)return 1;
  if((a.length>=4&&b.includes(a))||(b.length>=4&&a.includes(b)))return .86;
  const overlap=jaccard(tokenSet(a),tokenSet(b));
  const prefix=a.slice(0,4)===b.slice(0,4)?1:0;
  return Math.min(1,overlap*.88+prefix*.12);
}

export function hammingDistance(left='',right=''){
  if(!left||!right||left.length!==right.length)return null;
  let distance=0;
  for(let i=0;i<left.length;i++)if(left[i]!==right[i])distance++;
  return distance;
}

export function visualSimilarity(distance){
  if(distance===null||distance===undefined||!Number.isFinite(distance))return 0;
  if(distance<=2)return 1;
  if(distance<=4)return .98;
  if(distance<=6)return .95;
  if(distance<=8)return .91;
  if(distance<=10)return .87;
  if(distance<=12)return .82;
  if(distance<=14)return .76;
  if(distance<=16)return .69;
  if(distance<=20)return .55;
  if(distance<=24)return .4;
  return Math.max(0,.28-(distance-24)*.02);
}

export function metadataSimilarity(candidate={},item={}){
  const category=candidate.category&&item.category&&candidate.category===item.category?1:0;
  const colors=jaccard(candidate.colors||[],item.colors||[]);
  const styles=jaccard(candidate.styles||[],item.styles||[]);
  const name=nameSimilarity(candidate.name||'',item.name||'');
  const score=category*.38+colors*.25+styles*.12+name*.25;
  return {score,category,colors,styles,name};
}

export function duplicateAssessment({distance=null,metadata={score:0,category:0,colors:0,styles:0,name:0}}={}){
  const visual=visualSimilarity(distance);
  const hasVisual=distance!==null&&distance!==undefined&&Number.isFinite(distance);
  const score=hasVisual
    ? Math.min(1,visual*.72+metadata.score*.28)
    : Math.min(.94,metadata.score*.92);

  let level='none';
  if(
    (hasVisual&&distance<=4) ||
    (hasVisual&&distance<=8&&metadata.score>=.32) ||
    score>=.86 ||
    (metadata.name>=.99&&metadata.category===1&&metadata.colors>=.5)
  ) level='high';
  else if(
    (hasVisual&&distance<=12&&metadata.score>=.28) ||
    (hasVisual&&distance<=16&&metadata.score>=.48) ||
    score>=.72 ||
    (metadata.score>=.84&&metadata.name>=.7)
  ) level='medium';

  return {level,score,visual,distance,metadata};
}

const reason=(key,params={})=>({key,params});
export function duplicateReasons(assessment={}){
  const reasons=[];
  const {distance,metadata={}}=assessment;
  if(Number.isFinite(distance)){
    if(distance<=6)reasons.push(reason('duplicate.reason.imageAlmostSame'));
    else if(distance<=12)reasons.push(reason('duplicate.reason.imageVerySimilar'));
    else if(distance<=16)reasons.push(reason('duplicate.reason.imageSimilar'));
  }
  if(metadata.category===1)reasons.push(reason('duplicate.reason.sameCategory'));
  if(metadata.colors>=.5)reasons.push(reason('duplicate.reason.similarColors'));
  if(metadata.styles>=.5)reasons.push(reason('duplicate.reason.similarStyles'));
  if(metadata.name>=.86)reasons.push(reason('duplicate.reason.similarName'));
  return reasons.slice(0,4);
}
