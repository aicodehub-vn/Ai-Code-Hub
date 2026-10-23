/**
 * In-memory request admission. Never stores user briefs, model outputs or keys.
 * Per local bridge process only: this is not a distributed quota or billing cap.
 */
function createRequestGate({maxRequests=6,windowMs=60000,clock=()=>Date.now()}={}){
 if(!Number.isInteger(maxRequests)||maxRequests<1||maxRequests>60)throw new Error("maxRequests must be 1–60");
 if(!Number.isInteger(windowMs)||windowMs<1000||windowMs>3600000)throw new Error("Invalid windowMs");
 let timestamps=[],busy=false;
 function enter(){
  const now=clock();
  timestamps=timestamps.filter(value=>now-value<windowMs&&now>=value);
  if(busy)return {ok:false,code:429,retryAfter:1,reason:"busy"};
  if(timestamps.length>=maxRequests){
   const wait=Math.max(1,Math.ceil((timestamps[0]+windowMs-now)/1000));
   return {ok:false,code:429,retryAfter:wait,reason:"rate"};
  }
  timestamps.push(now);busy=true;
  let released=false;
  return {ok:true,release(){
   if(released)return;
   released=true;busy=false;
  }};
 }
 function status(){return {busy,requestsInWindow:timestamps.length,maxRequests}}
 return {enter,status};
}
export {createRequestGate};
