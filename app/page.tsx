'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, MapPin, Minus, Plus, Search, ShoppingBag, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { products, money, type Product } from '@/lib/catalog';

const categories = ['Todos', 'Esfirras salgadas', 'Esfirras doces', 'Pizzas', 'Bebidas'] as const;
type Filter = typeof categories[number];
type Cart = Record<string, number>;
type Zone = {id:string;name:string;fee:number};
type Settings = {ordersEnabled:boolean;pickupEnabled:boolean;deliveryEnabled:boolean;payOnPickupEnabled:boolean;pixEnabled:boolean};
type Receipt = {code:string;trackingToken:string;paymentMethod:string;paymentStatus:string;qrCode?:string|null;qrBase64?:string|null;total:number;paidAmount?:number};
const opening = ['Segunda · 16h30 às 20h30', 'Terça a sexta · 16h30 às 22h', 'Sábado e domingo · 17h às 22h30'];

export default function Home() {
  const [filter, setFilter] = useState<Filter>('Todos');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mode, setMode] = useState<'pickup'|'delivery'>('pickup');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<Receipt|null>(null);
  const [catalog, setCatalog] = useState<Product[]>(products);
  const [zones, setZones] = useState<Zone[]>([]);
  const [settings, setSettings] = useState<Settings>({ordersEnabled:false,pickupEnabled:true,deliveryEnabled:false,payOnPickupEnabled:false,pixEnabled:false});
  const [zoneId, setZoneId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'at_pickup'|'pix'>('at_pickup');
  const checkoutIdentity=useRef<{key:string;token:string}|null>(null);
  const zone=zones.find(z=>z.id===zoneId);
  const deliveryFee=mode==='delivery'?zone?.fee??0:0;
  useEffect(()=>{fetch('/api/catalog',{cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error('Cardápio indisponível');return response.json() as Promise<{products:Product[];zones:Zone[];settings:Settings}>}).then(data=>{setCatalog(data.products);setZones(data.zones);setSettings(data.settings);if(!data.settings.payOnPickupEnabled&&data.settings.pixEnabled)setPaymentMethod('pix');}).catch(()=>setError('Não foi possível carregar o cardápio atualizado. Tente novamente mais tarde.'));},[]);
  useEffect(()=>{if(!success || success.paymentMethod!=='pix' || success.paymentStatus==='paid')return;const timer=setInterval(async()=>{try{const response=await fetch(`/api/orders/status?code=${encodeURIComponent(success.code)}&token=${encodeURIComponent(success.trackingToken)}`,{cache:'no-store'});if(response.ok){const data=await response.json() as Partial<Receipt>;setSuccess(current=>current?.code===success.code?{...current,...data}:current);}}catch{}},10000);return()=>clearInterval(timer);},[success]);

  const visible = useMemo(() => catalog.filter(p =>
    (filter === 'Todos' || p.category === filter) &&
    `${p.name} ${p.description}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))
  ), [filter, query, catalog]);
  const lines = catalog.filter(p => cart[p.id] > 0).map(p => ({ ...p, quantity: cart[p.id] }));
  const subtotal = lines.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const count = lines.reduce((sum, p) => sum + p.quantity, 0);
  const change = (id: string, delta: number) => {checkoutIdentity.current=null;setCart(old => ({ ...old, [id]: Math.max(0, Math.min(30, (old[id] ?? 0) + delta)) }));};
  const goCatalog = () => document.getElementById('cardapio')?.scrollIntoView({ behavior: 'smooth' });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(''); setSending(true);
    const form = new FormData(e.currentTarget);
    try {
      if(!checkoutIdentity.current)checkoutIdentity.current={key:crypto.randomUUID(),token:crypto.randomUUID()};
      const response = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map(({ id, quantity }) => ({ id, quantity })),
          customerName: String(form.get('name') ?? '').trim(),
          phone: String(form.get('phone') ?? '').trim(),
          email:String(form.get('email')??'').trim(),
          fulfillment: mode,
          address: mode === 'delivery' ? String(form.get('address') ?? '').trim() : '',
          zoneId:mode==='delivery'?zoneId:'',
          paymentMethod:settings.ordersEnabled?paymentMethod:'test',
          checkoutKey:checkoutIdentity.current.key,trackingToken:checkoutIdentity.current.token,
          note: note.trim(),
        }),
      });
      const data = await response.json() as Receipt & {error?:string};
      if (!response.ok) throw new Error(data.error || 'Não foi possível registrar o pedido. Tente novamente.');
      setCart({}); setCartOpen(false); setCheckoutOpen(false); setSuccess(data); setNote('');checkoutIdentity.current=null;
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível registrar o pedido.'); }
    finally { setSending(false); }
  }

  return <div className="site-shell">
    {!settings.ordersEnabled && <div className="preview-notice">Prévia privada · pedidos de teste não são enviados à loja</div>}
    <header className="site-header">
      <a href="#inicio" className="brand" aria-label="Porto Esfirras, início"><span className="brand-mark">P<span>✦</span></span><span className="brand-word">PORTO <small>ESFIRRAS</small></span></a>
      <nav className="desktop-nav" aria-label="Navegação"><a href="#cardapio">Cardápio</a><a href="#historia">Nossa história</a><a href="#contato">Onde estamos</a></nav>
      <button type="button" className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Abrir sacola, ${count} itens`}><ShoppingBag size={19}/><span className="cart-label">Minha sacola</span><b>{count}</b></button>
    </header>

    <main id="inicio">
      <section className="hero">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div className="hero-inner"><div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line"/> FEITA EM PORTO VELHO</p>
          <h1>Todo encontro<br/>merece uma <em>boa esfirra.</em></h1>
          <p className="hero-text">Preparadas na hora, bem recheadas e feitas para deixar a sua noite ainda melhor.</p>
          <button type="button" onClick={goCatalog} className="primary-button">Explorar cardápio <ArrowRight size={18}/></button>
          <div className="hero-foot"><span className="star">✳</span><span>Da nossa cozinha para a sua mesa<br/><strong>Porto Velho, Rondônia</strong></span></div>
        </div></div>
        <span className="hero-index">01 / SABOR QUE APROXIMA</span>
      </section>

      <section className="intro-strip" aria-label="Destaques"><span>Feitas na hora</span><span className="strip-star">✦</span><span>Recheio de verdade</span><span className="strip-star">✦</span><span>O sabor de Porto Velho</span></section>

      <section className="menu-section" id="cardapio">
        <div className="section-top"><div><p className="eyebrow dark">ESCOLHA SEU FAVORITO</p><h2>Nosso <em>cardápio.</em></h2><p className="section-lead">Peça suas esfirras, pizzas e bebidas favoritas em poucos passos.</p></div><div className="menu-count"><span>01 — 04</span><p>Feitos para compartilhar.</p></div></div>
        <div className="menu-controls"><div className="category-list" role="group" aria-label="Filtrar categoria">{categories.map(category => <button key={category} type="button" className={filter === category ? 'category active' : 'category'} onClick={() => setFilter(category)}>{category}</button>)}</div><label className="search-box"><Search size={18}/><span className="sr-only">Buscar no cardápio</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar um sabor..." /></label></div>
        <div className="menu-grid">{visible.map((p, i) => <article className={`product-card ${p.featured ? 'featured' : ''}`} key={p.id} style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
          {p.featured && <div className="product-image"><img src="/esfirra-hero.png" alt="Esfirra recém assada, imagem ilustrativa" loading="lazy" /></div>}
          <div className="product-body"><span className="product-category">{p.category}</span><h3>{p.name}</h3><p>{p.description}</p><div className="product-bottom"><strong>{money(p.price)}</strong><button type="button" className="add-button" onClick={() => change(p.id, 1)} aria-label={`Adicionar ${p.name} à sacola`}><Plus size={19}/></button></div></div>
        </article>)}</div>
        {visible.length === 0 && <div className="empty-search">Nenhum item encontrado. Experimente outro sabor ou categoria.</div>}
        {!settings.ordersEnabled&&<p className="menu-disclaimer">Cardápio transcrito das imagens enviadas. Sabores, composição, disponibilidade e preços devem ser confirmados pela Porto Esfirras antes da abertura ao público.</p>}
      </section>

      <section className="story-section" id="historia"><div className="story-decor">P</div><div className="story-content"><p className="eyebrow">NOSSA HISTÓRIA</p><h2>De Porto Velho,<br/><em>com carinho.</em></h2><p>A Porto Esfirras nasceu em Porto Velho, Rondônia, inspirada pelo desejo de criar uma esfiharia com identidade própria. Desde o começo, nosso compromisso é com produtos preparados na hora, bem recheados e com qualidade constante.</p><p>“Porto” é nossa homenagem à cidade onde tudo começou e à comunidade que faz parte desta história.</p><a href="https://www.instagram.com/portoesfirras" target="_blank" rel="noopener noreferrer" className="text-link">Acompanhe no Instagram <ArrowRight size={17}/></a></div></section>

      <section className="visit-section" id="contato"><div><p className="eyebrow dark">VENHA NOS CONHECER</p><h2>Sua próxima parada:<br/><em>Porto Esfirras.</em></h2><p className="visit-address"><MapPin size={20}/> Av. Calama, 5902 · Igarapé<br/>Porto Velho, RO · 76824-218</p><a className="outline-button" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=Av.+Calama+5902+Igarap%C3%A9+Porto+Velho+RO">Como chegar <ArrowRight size={17}/></a></div><div className="hours-card"><span className="hours-icon">✳</span><h3>Horário de funcionamento</h3><p>{opening[0]}</p><p>{opening[1]}</p><p>{opening[2]}</p><small>Confirme o funcionamento diretamente com a loja antes de visitar.</small></div></section>
    </main>
    <footer><div className="footer-main"><div className="brand light"><span className="brand-mark">P<span>✦</span></span><span className="brand-word">PORTO <small>ESFIRRAS</small></span></div><p>O sabor que aproxima a gente.</p><a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/portoesfirras">Instagram ↗</a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Porto Esfirras · Porto Velho, RO</span><span>Feito com carinho e recheio de verdade.</span></div></footer>

    {count > 0 && <button type="button" className="floating-cart" onClick={() => setCartOpen(true)}><span><ShoppingBag size={19}/> Ver sacola <b>{count}</b></span><strong>{money(subtotal)} <ArrowRight size={17}/></strong></button>}

    <Sheet open={cartOpen} onOpenChange={setCartOpen}><SheetContent className="cart-sheet"><SheetHeader className="cart-head"><span className="eyebrow dark">SEU PEDIDO</span><SheetTitle className="cart-title">Minha sacola <span>({count})</span></SheetTitle><SheetDescription>Confira seus itens antes de continuar.</SheetDescription></SheetHeader><div className="cart-items">{!lines.length && <div className="cart-empty"><ShoppingBag size={30}/><h3>Sua sacola está vazia</h3><p>Escolha algo gostoso no nosso cardápio.</p><button type="button" className="primary-button" onClick={() => { setCartOpen(false); goCatalog(); }}>Explorar cardápio <ArrowRight size={17}/></button></div>}{lines.map(p => <div className="cart-item" key={p.id}><div><h3>{p.name}</h3><span>{money(p.price)} cada</span></div><div className="cart-item-right"><strong>{money(p.price * p.quantity)}</strong><div className="qty"><button type="button" onClick={() => change(p.id,-1)} aria-label={`Remover uma unidade de ${p.name}`}><Minus size={16}/></button><span>{p.quantity}</span><button type="button" onClick={() => change(p.id,1)} aria-label={`Adicionar uma unidade de ${p.name}`}><Plus size={16}/></button></div></div></div>)}</div>{!!lines.length && <div className="cart-footer"><div className="total-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>{settings.deliveryEnabled ? "Taxa calculada após escolher o bairro." : "Retirada na loja disponível."}</p><button type="button" className="primary-button full" onClick={() => {setCartOpen(false); setCheckoutOpen(true);}}>Continuar pedido <ArrowRight size={17}/></button></div>}</SheetContent></Sheet>

    <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}><DialogContent className="checkout-dialog"><DialogHeader><p className="eyebrow dark">QUASE LÁ</p><DialogTitle>Finalizar pedido</DialogTitle><DialogDescription>{settings.ordersEnabled ? 'Confira o endereço, o pagamento e o total antes de confirmar.' : 'Prévia privada: o pedido fica registrado apenas para teste e não será enviado à cozinha.'}</DialogDescription></DialogHeader><form onSubmit={submit} className="checkout-form"><div className="fulfillment"><button type="button" className={mode === 'pickup' ? 'selected' : ''} disabled={settings.ordersEnabled&&!settings.pickupEnabled} onClick={() => {setMode('pickup');setPaymentMethod(settings.payOnPickupEnabled?'at_pickup':'pix');checkoutIdentity.current=null;}}>Retirar na loja</button><button type="button" className={mode === 'delivery' ? 'selected' : ''} disabled={settings.ordersEnabled&&!settings.deliveryEnabled} onClick={() => {setMode('delivery');setPaymentMethod('pix');checkoutIdentity.current=null;}}>Entrega</button></div><label>Seu nome<input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Como podemos te chamar?" /></label><label>Celular com DDD<input name="phone" required inputMode="tel" type="tel" pattern="[0-9()+.\s-]{10,20}" placeholder="(69) 99999-9999" autoComplete="tel" /></label>{(paymentMethod==='pix'&&settings.ordersEnabled) && <label>E-mail para o Pix<input name="email" required type="email" autoComplete="email" placeholder="voce@exemplo.com" /></label>}{mode==='delivery' && <><label>Bairro atendido<select value={zoneId} required={settings.ordersEnabled} onChange={e=>{setZoneId(e.target.value);checkoutIdentity.current=null;}}><option value="">Selecione o bairro</option>{zones.map(z=><option key={z.id} value={z.id}>{z.name} · {money(z.fee)}</option>)}</select></label><label>Endereço para entrega<input name="address" required minLength={8} maxLength={240} autoComplete="street-address" placeholder="Rua, número e referência" /></label></>}<label>Observações para o pedido<textarea value={note} onChange={e => setNote(e.target.value)} maxLength={300} placeholder="Ex.: sabores da pizza ou alguma preferência" rows={3}/></label>{settings.ordersEnabled&&<div className="fulfillment payment-choice">{mode==='pickup'&&settings.payOnPickupEnabled&&<button type="button" className={paymentMethod==='at_pickup'?'selected':''} onClick={()=>{setPaymentMethod('at_pickup');checkoutIdentity.current=null;}}>Pagar na retirada</button>}{settings.pixEnabled&&<button type="button" className={paymentMethod==='pix'?'selected':''} onClick={()=>{setPaymentMethod('pix');checkoutIdentity.current=null;}}>Pagar com Pix</button>}</div>}<p className="checkout-hint">{settings.ordersEnabled ? mode==='delivery' ? 'Entrega somente nos bairros listados. O pedido é enviado após a confirmação integral do Pix.' : paymentMethod==='pix' ? 'O pedido será recebido pela loja após confirmação integral do Pix.' : 'Pagamento combinado na retirada, diretamente com a loja.' : 'Pedido de teste: não há cobrança nem aviso automático para a cozinha.'}</p><div className="total-row"><span>Itens</span><strong>{money(subtotal)}</strong></div>{mode==='delivery'&&settings.ordersEnabled&&<div className="total-row"><span>Entrega</span><strong>{money(deliveryFee)}</strong></div>}<div className="total-row grand-total"><span>Total</span><strong>{money(subtotal+(settings.ordersEnabled?deliveryFee:0))}</strong></div>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="primary-button full" disabled={sending || !lines.length || settings.ordersEnabled&&mode==='delivery'&&!zone || settings.ordersEnabled&&mode==='pickup'&&!settings.pickupEnabled}>{sending ? 'Registrando...' : settings.ordersEnabled ? paymentMethod==='pix' ? 'Gerar Pix e confirmar' : 'Confirmar pedido' : 'Registrar pedido de teste'} <ArrowRight size={17}/></button></form></DialogContent></Dialog>

    <Dialog open={!!success} onOpenChange={open => !open && setSuccess(null)}><DialogContent className="success-dialog"><div className="success-spark"><Sparkles size={27}/></div><DialogHeader><DialogTitle>{success?.paymentMethod==='pix'?success.paymentStatus==='paid'?'Pagamento confirmado!':'Aguardando seu Pix':success?.paymentMethod==='test'?'Pedido de teste registrado!':'Pedido registrado!'}</DialogTitle><DialogDescription>Pedido <strong>#{success?.code}</strong> · total {money(success?.total??0)}. {success?.paymentMethod==='test'?'Não houve pagamento nem aviso à cozinha.':success?.paymentMethod==='at_pickup'?'A loja poderá acompanhar o pedido pelo painel. Pague na retirada.':success?.paymentStatus==='paid'?'Recebemos a confirmação do pagamento.':'O pedido será liberado para preparo quando o pagamento integral for confirmado.'}</DialogDescription></DialogHeader>{success?.paymentMethod==='pix'&&success.paymentStatus!=='paid'&&<div className="pix-panel">{success.qrBase64&&<img src={`data:image/png;base64,${success.qrBase64}`} alt="QR Code Pix para pagamento"/>}{success.qrCode&&<><label>Pix copia e cola<input readOnly value={success.qrCode} /></label><button type="button" className="outline-button" onClick={()=>navigator.clipboard.writeText(success.qrCode??'')}>Copiar código Pix</button></>}<p>{success.paymentStatus==='partial'?'Pagamento parcial identificado. Valor recebido: '+money(success.paidAmount??0)+'. Aguarde a confirmação do valor total.':'Aguardando confirmação automática do pagamento.'}</p></div>}<button type="button" className="primary-button full" onClick={() => setSuccess(null)}>Voltar ao cardápio <ArrowRight size={17}/></button></DialogContent></Dialog>
  </div>;
}
