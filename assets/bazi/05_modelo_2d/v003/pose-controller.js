/* Complete original poses only. Never detach anatomy or redraw facial features. */
(function(global){
  'use strict';
  class BaziPosePlayer {
    constructor(root){
      this.root=root;this.images=new Map([...root.querySelectorAll('img[data-state]')].map(img=>[img.dataset.state,img]));
      this.state='idle';this.visible='idle';this.pending=null;this.serial=0;this.anim=null;this.disposed=false;
      this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
      this.instant=false;this.audit=false;this.listeners=new Set();this._show('idle');
      this._hide=()=>{if(document.hidden)this.finish();};document.addEventListener('visibilitychange',this._hide);
    }
    _emit(phase){this.root.dataset.phase=phase;this.root.dataset.state=this.state;for(const fn of this.listeners)fn({state:this.state,phase});}
    onChange(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
    _cancel(){if(this.anim){this.anim.cancel();this.anim=null;}}
    _show(state){
      for(const [key,img] of this.images){img.style.opacity=key===state?'1':'0';img.style.transform='none';img.setAttribute('aria-hidden',String(key!==state));}
      this.visible=state;
    }
    async setState(state,{immediate=false}={}){
      if(!this.images.has(state))throw new Error('No original reference for pose: '+state);
      if(this.disposed)return;
      const old=this.images.get(this.visible),opacity=Number(getComputedStyle(old).opacity);
      const token=++this.serial;this._cancel();old.style.opacity=String(opacity);this.state=state;this.pending=state;
      if(immediate||this.instant||this.reduced.matches||document.hidden||this.audit){this.finish();return;}
      this._emit('transition');
      const next=this.images.get(state);
      if(this.visible===state){this.finish();return;}
      // Only one full illustration is visible at a time, including mid-transition.
      try{
        this.anim=old.animate([{opacity},{opacity:0}],{duration:100,easing:'cubic-bezier(0.23, 1, 0.32, 1)',fill:'forwards'});
        await this.anim.finished;
        if(token!==this.serial||this.disposed)return;
        this._cancel();this._show(state);next.style.opacity='0';
        this.anim=next.animate([{opacity:0},{opacity:1}],{duration:180,easing:'cubic-bezier(0.23, 1, 0.32, 1)',fill:'forwards'});
        await this.anim.finished;
        if(token!==this.serial||this.disposed)return;
        this._cancel();this.pending=null;this._show(state);this._emit('settled');
      }catch(error){if(error.name!=='AbortError')throw error;}
    }
    finish(){++this.serial;this._cancel();this.pending=null;this._show(this.state);this._emit('settled');}
    dispose(){this.disposed=true;++this.serial;this._cancel();document.removeEventListener('visibilitychange',this._hide);this.listeners.clear();}
  }
  global.BaziPosePlayer=BaziPosePlayer;
})(window);
