const root=document.querySelector('#mainContent');

function patchPhotoInput(){
  const input=document.querySelector('#photoInput');
  if(!input)return false;
  input.removeAttribute('capture');
  input.setAttribute('accept','image/*');
  return true;
}

patchPhotoInput();
if(root){
  new MutationObserver(()=>patchPhotoInput()).observe(root,{childList:true,subtree:true});
}
