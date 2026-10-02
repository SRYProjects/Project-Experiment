const feed=document.querySelector("#archiveFeed");
const category=document.querySelector("#archiveCategory");
const username=document.querySelector("#archiveUsername");
const showAll=document.querySelector("#archiveShowAll");
const loadMore=document.querySelector("#loadMoreActions");
const PAGE_SIZE=50;
let offset=0;
let loading=false;

function formatDate(value){
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(date);
}

function createCard(action){
  const article=document.createElement("article");
  article.className="action-card";
  const meta=document.createElement("div");
  meta.className="action-meta";
  const name=document.createElement("strong");
  name.textContent=action.username;
  const cat=document.createElement("span");
  cat.textContent=action.category;
  const time=document.createElement("time");
  time.dateTime=action.createdAt;
  time.textContent=formatDate(action.createdAt);
  meta.append(name,cat,time);
  if(action.isExample){
    const example=document.createElement("span");
    example.className="example-label";
    example.textContent="Example";
    meta.append(example);
  }
  const text=document.createElement("p");
  text.className="action-text";
  text.textContent=action.actionText;
  article.append(meta,text);
  return article;
}

async function loadActions({append=false}={}){
  if(loading) return;
  loading=true;
  feed.setAttribute("aria-busy","true");
  if(!append){
    offset=0;
    feed.replaceChildren();
    const p=document.createElement("p");
    p.className="empty-state";
    p.textContent="Loading Meaningful Actions…";
    feed.append(p);
  }
  const params=new URLSearchParams({limit:String(PAGE_SIZE),offset:String(offset)});
  if(category.value) params.set("category",category.value);
  if(username.value.trim()) params.set("username",username.value.trim());
  try{
    const response=await fetch(`/api/actions?${params.toString()}`);
    if(!response.ok) throw new Error("Request failed");
    const result=await response.json();
    const actions=Array.isArray(result.actions)?result.actions:[];
    if(!append) feed.replaceChildren();
    if(actions.length===0&&offset===0){
      const p=document.createElement("p");
      p.className="empty-state";
      p.textContent="No results found.";
      feed.append(p);
    }else{
      const fragment=document.createDocumentFragment();
      for(const action of actions) fragment.append(createCard(action));
      feed.append(fragment);
    }
    offset+=actions.length;
    loadMore.classList.toggle("hidden",result.hasMore!==true);
  }catch(error){
    console.error("Meaningful Actions archive failed:",error);
    if(!append){
      feed.replaceChildren();
      const p=document.createElement("p");
      p.className="empty-state";
      p.textContent="Meaningful Actions are temporarily unavailable.";
      feed.append(p);
    }
    loadMore.classList.add("hidden");
  }finally{
    feed.setAttribute("aria-busy","false");
    loading=false;
  }
}

category.addEventListener("change",()=>loadActions());
let timer;
username.addEventListener("input",()=>{
  clearTimeout(timer);
  timer=setTimeout(()=>loadActions(),250);
});
showAll.addEventListener("click",()=>{
  category.value="";
  username.value="";
  loadActions();
  category.focus();
});
loadMore.addEventListener("click",()=>loadActions({append:true}));
await loadActions();
