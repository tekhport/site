(function(){
  /* ===== НАСТРОЙКИ САЙТА (общие для всех страниц) ===== */
  var CONFIG = {
    formEndpoint: "",   // адрес формы Formspree, например "https://formspree.io/f/xxxxxxx". Пусто = письмо через почтовую программу
    telegram: "",       // ссылка на Telegram, например "https://t.me/имя". Пусто = иконка скрыта
    email: "info@tekhport.ru"
  };
  var LANG = document.documentElement.lang === 'en' ? 'en' : 'ru';
  var I18N = {
    ru:{topic:'Тема запроса: ',subject:'Запрос с сайта',n:'Имя',e:'Email',p:'Телефон',
        mailOpened:'Открываем почтовую программу с готовым письмом. Если оно не открылось, напишите на info@tekhport.ru.',
        sending:'Отправляем…',ok:'Спасибо! Запрос отправлен, мы свяжемся с вами.',err:'Не удалось отправить. Напишите нам на'},
    en:{topic:'Request topic: ',subject:'Website request',n:'Name',e:'Email',p:'Phone',
        mailOpened:'Opening your email app with a ready message. If it did not open, write to info@tekhport.ru.',
        sending:'Sending…',ok:'Thank you! Your request has been sent, we will get back to you.',err:'Could not send. Please write to us at'}
  };
  var T = I18N[LANG];
  function $(id){ return document.getElementById(id); }

  /* Меню */
  var burger=document.querySelector('.burger'), nav=$('nav');
  if(burger&&nav){
    burger.addEventListener('click',function(){
      var open=nav.classList.toggle('open');
      burger.setAttribute('aria-expanded',open);
    });
    nav.addEventListener('click',function(e){ if(e.target.closest('a')){ nav.classList.remove('open'); burger.setAttribute('aria-expanded','false'); } });
  }

  /* Видео на первом экране (только на главной) */
  var v=$('heroVideo');
  if(v){
    var reduce=window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tryPlay=function(){ var pr=v.play(); if(pr&&pr.catch){ pr.catch(function(){}); } };
    v.muted=true;
    v.addEventListener('playing',function(){ v.classList.add('ready'); });
    v.addEventListener('loadeddata',function(){ v.classList.add('ready'); });
    if(!reduce){
      tryPlay();
      /* если браузер заблокировал автозапуск (например, режим энергосбережения), запускаем при первом касании */
      document.addEventListener('touchstart',function(){ if(v.paused){ tryPlay(); } },{once:true,passive:true});
    }
  }

  /* Тема запроса приходит из ссылки: contacts.html?topic=... */
  var topic='', topicEl=$('topic');
  try{ topic=(new URLSearchParams(location.search).get('topic')||'').slice(0,120); }catch(e){}
  if(topic&&topicEl){ topicEl.textContent=T.topic+topic; topicEl.classList.add('on'); }

  /* Telegram */
  var tg=$('tg');
  if(tg&&CONFIG.telegram){ tg.href=CONFIG.telegram; tg.hidden=false; }

  /* Условия обработки персональных данных */
  var dlg=$('privacy');
  if(dlg){
    document.querySelectorAll('[data-open-privacy]').forEach(function(a){
      a.addEventListener('click',function(e){
        e.preventDefault();
        if(dlg.showModal){ dlg.showModal(); } else { dlg.setAttribute('open',''); }
      });
    });
    $('privacy-close').addEventListener('click',function(){ if(dlg.close){dlg.close();} else {dlg.removeAttribute('open');} });
    dlg.addEventListener('click',function(e){ if(e.target===dlg && dlg.close){ dlg.close(); } });
    if(location.hash==='#privacy'){ if(dlg.showModal){ dlg.showModal(); } }
  }

  /* Просмотр фото на весь экран: нажатие, свайп влево/вправо, стрелки клавиатуры */
  var thumbs=[].slice.call(document.querySelectorAll('[data-lb]')), lb=$('lightbox');
  if(thumbs.length&&lb){
    var imgs=thumbs.map(function(b){ return b.querySelector('img'); });
    var im=$('lb-img'), cnt=$('lb-count'), stage=$('lb-stage'), idx=0;
    var show=function(i){
      idx=(i+imgs.length)%imgs.length;
      im.src=imgs[idx].currentSrc||imgs[idx].src; im.alt=imgs[idx].alt;
      cnt.textContent=(idx+1)+' / '+imgs.length;
    };
    var openAt=function(i){ show(i); if(lb.showModal){ lb.showModal(); } else { lb.setAttribute('open',''); } };
    var closeLb=function(){ if(lb.close){ lb.close(); } else { lb.removeAttribute('open'); } };
    thumbs.forEach(function(b,i){ b.addEventListener('click',function(){ openAt(i); }); });
    $('lb-close').addEventListener('click',closeLb);
    $('lb-prev').addEventListener('click',function(){ show(idx-1); });
    $('lb-next').addEventListener('click',function(){ show(idx+1); });
    stage.addEventListener('click',function(e){ if(e.target===stage){ closeLb(); } });
    document.addEventListener('keydown',function(e){
      if(!lb.open) return;
      if(e.key==='ArrowLeft') show(idx-1);
      if(e.key==='ArrowRight') show(idx+1);
    });
    var x0=null;
    stage.addEventListener('touchstart',function(e){ x0=e.touches.length===1?e.touches[0].clientX:null; },{passive:true});
    stage.addEventListener('touchend',function(e){
      if(x0===null) return;
      var dx=e.changedTouches[0].clientX-x0; x0=null;
      if(Math.abs(dx)>50){ show(dx<0?idx+1:idx-1); }
    },{passive:true});
  }

  /* Форма заявки (страница «Контакты») */
  var form=$('form'), status=$('status'), btn=$('send');
  if(form){
    var setStatus=function(msg,isErr){ status.textContent=msg; status.className='status'+(isErr?' err':''); };
    var mailtoUrl=function(d){
      var subject=T.subject+(topic?': '+topic:'');
      var body=T.n+': '+d.get('name')+'\n'+T.e+': '+d.get('email')+'\n'+T.p+': '+(d.get('phone')||'—')+'\n\n'+d.get('message');
      return 'mailto:'+CONFIG.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    };
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(!form.checkValidity()){ form.reportValidity(); return; }
      var d=new FormData(form);
      if(d.get('website')){ return; }
      d.delete('website');
      if(!CONFIG.formEndpoint){
        window.location.href=mailtoUrl(d);
        setStatus(T.mailOpened,false);
        return;
      }
      d.append('topic',topic||'—'); d.append('language',LANG); d.append('_subject',T.subject+(topic?': '+topic:''));
      btn.disabled=true; setStatus(T.sending,false);
      fetch(CONFIG.formEndpoint,{method:'POST',body:d,headers:{'Accept':'application/json'}})
        .then(function(r){
          if(!r.ok){ throw new Error('bad status'); }
          form.reset(); topic=''; if(topicEl){ topicEl.classList.remove('on'); } setStatus(T.ok,false);
        })
        .catch(function(){
          status.className='status err'; status.innerHTML='';
          status.appendChild(document.createTextNode(T.err+' '));
          var a=document.createElement('a'); a.href=mailtoUrl(d); a.textContent=CONFIG.email; status.appendChild(a);
        })
        .then(function(){ btn.disabled=false; });
    });
  }
})();
