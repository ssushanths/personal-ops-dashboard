(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={appName:`Personal Ops Dashboard`,storageKey:`personal_ops_dashboard_project_v1`,settingsKey:`personal_ops_dashboard_project_v1_settings`,monthlySalary:0,salaryPin:`000000`,currency:`EUR`};function t(e){if(!e)return``;let[t,n,r]=e.split(`-`);return!t||!n||!r?e:`${r}-${n}-${t}`}function n(e,n){let r=e.accounts?.asOfDate||``,i=Number(e.accounts?.current?.openingBalance||0),a=Number(e.accounts?.savings?.openingBalance||0),o=n.accountBalances||{current:0,savings:0,total:0};return[[`Balance Sheet Summary`,``],[``,``],[`Tracking From`,t(r)],[`Opening Current Account`,i],[`Opening Savings Account`,a],[``,``],[`Projected Leftover`,n.balanceLeft],[`Predicted Savings`,n.predictedSavings],[`Monthly Recurring`,n.monthlyRecurring],[`One-Time Payments This Month`,n.oneTimePaymentsThisMonth],[`One-Time Expenses This Month`,n.extraExpensesThisMonth],[`Total This Month`,n.totalThisMonth],[``,``],[`Current Account Balance`,o.current],[`Savings Account Balance`,o.savings],[`Total Cash`,o.total]]}function r(e){return[[`Title`,`Due Date`,`Amount`,`Category`,`Account`,`Recurring`,`Paid`,`Paid On`],...(e.payments||[]).map(e=>[e.title||``,t(e.dueDate||``),Number(e.amount||0),e.category||`Misc`,e.account||`Current`,e.recurring?`Yes`:`No`,e.paid?`Yes`:`No`,t(e.paidOn||``)])]}function i(e){return[[`Title`,`Renewal Date`,`Amount`,`Category`,`Account`,`Paid On`],...(e.subscriptions||[]).map(e=>[e.title||``,t(e.renewalDate||``),Number(e.amount||0),e.category||`Subscriptions`,e.account||`Current`,t(e.paidOn||``)])]}function a(e){return[[`Title`,`Date`,`Amount`,`Category`,`Account`],...(e.expenses||[]).map(e=>[e.title||``,t(e.date||``),Number(e.amount||0),e.category||`Misc`,e.account||`Current`])]}function o(e){return[[`Date`,`Amount`,`From Account`,`To Account`,`Note`],...(e.transfers||[]).map(e=>[t(e.date||``),Number(e.amount||0),e.fromAccount||``,e.toAccount||``,e.note||``])]}function s(e){let t=[];return e.forEach(e=>{e.forEach((e,n)=>{let r=String(e??``).length;t[n]=Math.max(t[n]||10,Math.min(r+2,28))})}),t.map(e=>({wch:e}))}function c(e,t){if(!window.XLSX)throw Error(`Excel export library not loaded.`);let c=window.XLSX,l=c.utils.book_new(),u=n(e,t),d=r(e),f=i(e),p=a(e),m=o(e),h=c.utils.aoa_to_sheet(u),g=c.utils.aoa_to_sheet(d),_=c.utils.aoa_to_sheet(f),v=c.utils.aoa_to_sheet(p),y=c.utils.aoa_to_sheet(m);h[`!cols`]=s(u),g[`!cols`]=s(d),_[`!cols`]=s(f),v[`!cols`]=s(p),y[`!cols`]=s(m),c.utils.book_append_sheet(l,h,`Summary`),c.utils.book_append_sheet(l,g,`Payments`),c.utils.book_append_sheet(l,_,`Subscriptions`),c.utils.book_append_sheet(l,v,`Expenses`),c.utils.book_append_sheet(l,y,`Transfers`),c.writeFile(l,`personal-balance-sheet.xlsx`)}var l=(e=0)=>{let t=new Date;return t.setDate(t.getDate()+e),t.toISOString().split(`T`)[0]};function u(){return{tasks:[],payments:[],subscriptions:[],expenses:[],inflows:[{id:crypto.randomUUID(),title:`Salary`,amount:4610.5,recurring:!0,recurrenceType:`monthly_last_weekday`,weekday:4,account:`Current`,active:!0}],accounts:{asOfDate:`2026-04-23`,current:{openingBalance:74.35},savings:{openingBalance:3062.07}},transfers:[],savingsInterest:{aer:.015,startDate:l(0),lastPostedMonth:``}}}function d(){return{reminderDays:2,notificationsEnabled:!1,sentReminderKeys:{},salaryUnlocked:!1,salaryMessage:`Salary hidden.`}}function f(){return u()}function p(e){return{...e,tasks:e.tasks||[],payments:(e.payments||[]).map(e=>({category:`Misc`,account:`Current`,...e})),inflows:(e.inflows||[{id:crypto.randomUUID(),title:`Salary`,amount:3e3,recurring:!0,recurrenceType:`monthly_last_weekday`,weekday:4,account:`Current`,active:!0}]).map(e=>({account:`Current`,active:!0,...e})),subscriptions:(e.subscriptions||[]).map(e=>({category:`Subscriptions`,account:`Current`,...e})),expenses:(e.expenses||[]).map(e=>({category:`Misc`,account:`Current`,...e})),accounts:{asOfDate:e.accounts?.asOfDate||new Date().toISOString().slice(0,10),current:{openingBalance:Number(e.accounts?.current?.openingBalance??0)},savings:{openingBalance:Number(e.accounts?.savings?.openingBalance??0)}},savingsInterest:{aer:Number(e.savingsInterest?.aer??.015),startDate:e.savingsInterest?.startDate||new Date().toISOString().slice(0,10),lastPostedMonth:e.savingsInterest?.lastPostedMonth||``},transfers:e.transfers||[]}}function m(t=u()){try{let n=localStorage.getItem(e.storageKey);return p(n?JSON.parse(n):t)}catch{return p(t)}}function h(t){localStorage.setItem(e.storageKey,JSON.stringify(t))}function g(){try{let t=localStorage.getItem(e.settingsKey);return t?JSON.parse(t):d()}catch{return d()}}function _(t){localStorage.setItem(e.settingsKey,JSON.stringify(t))}function v(e){return e.toISOString().split(`T`)[0]}function y(e){if(!e)return null;let t=new Date;t.setHours(0,0,0,0);let n=new Date(`${e}T00:00:00`);return Math.round((n-t)/864e5)}function b(e,t){let n=new Date(`${e}T00:00:00`),r=new Date(n.getFullYear(),n.getMonth()+1,1),i=new Date(r.getFullYear(),r.getMonth()+1,0).getDate();return r.setDate(Math.min(t||n.getDate(),i)),v(r)}function x(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function ee(e){return Math.round((e+2**-52)*100)/100}function te(e){return`${e.slice(0,7)}-01`}function S(e,t,n){t&&(e[t]=(e[t]||0)+(Number(n)||0))}function C(e){let t={};return(e.inflows||[]).forEach(e=>{e.active&&e.account===`Savings`&&(e.recurring||S(t,e.date,e.amount))}),(e.expenses||[]).forEach(e=>{e.account===`Savings`&&S(t,e.date,-Number(e.amount||0))}),(e.payments||[]).forEach(e=>{e.account===`Savings`&&e.paidOn&&S(t,e.paidOn,-Number(e.amount||0))}),(e.subscriptions||[]).forEach(e=>{e.account===`Savings`&&e.paidOn&&S(t,e.paidOn,-Number(e.amount||0))}),(e.transfers||[]).forEach(e=>{let n=Number(e.amount||0);e.toAccount===`Savings`&&S(t,e.date,n),e.fromAccount===`Savings`&&S(t,e.date,-n)}),t}function ne(e,t){let n=Number(e.accounts?.savings?.openingBalance||0),r=C(e),i=n;return Object.keys(r).sort().forEach(e=>{e<t&&(i+=r[e])}),i}function re(e){let t=x(new Date),n=e.savingsInterest||{},r=n.startDate||t,i=te(t),a=r>i?r:i;if(a>t)return 0;let o=(1+Number(n.aer||.015))**(1/365)-1,s=C(e),c=ne(e,a),l=0,u=new Date(`${a}T00:00:00`),d=new Date(`${t}T00:00:00`);for(;u<=d;){let e=x(u);c+=s[e]||0,l+=c*o,u.setDate(u.getDate()+1)}return ee(l)}function w(e){return e.recurring?e.lastPaidMonth===e.dueDate.slice(0,7):!!e.paid}function T(e){return e.lastPaidMonth===e.renewalDate.slice(0,7)}function ie(e,t){let n=v(new Date);e.payments=e.payments.map(e=>e.id===t?e.recurring?{...e,lastPaidMonth:e.dueDate.slice(0,7),paidOn:n,dueDate:b(e.dueDate,e.recurrenceDay||new Date(`${e.dueDate}T00:00:00`).getDate())}:{...e,paid:!0,paidOn:n}:e)}function ae(e,t){let n=v(new Date);e.subscriptions=e.subscriptions.map(e=>e.id===t?{...e,lastPaidMonth:e.renewalDate.slice(0,7),paidOn:n,renewalDate:b(e.renewalDate,e.recurrenceDay||new Date(`${e.renewalDate}T00:00:00`).getDate())}:e)}function E(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function D(){let e=new Date;return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}`}function O(e){return e&&e.startsWith(D())}function k(e,t,n){let r=t||`Misc`;e[r]=(e[r]||0)+(Number(n)||0)}function oe(e,t,n){let r=new Date(e,t+1,0);for(;r.getDay()!==n;)r.setDate(r.getDate()-1);return E(r)}function A(e){let t=new Date,n=t.getFullYear(),r=t.getMonth();return e.recurrenceType===`monthly_last_weekday`?oe(n,r,e.weekday):null}function se(e){let t={current:{opening:Number(e.accounts?.current?.openingBalance||0),salaryInflows:0,paidPayments:0,paidSubscriptions:0,expenses:0,transfersOut:0,transfersIn:0},savings:{opening:Number(e.accounts?.savings?.openingBalance||0),salaryInflows:0,paidPayments:0,paidSubscriptions:0,expenses:0,transfersOut:0,transfersIn:0}},n=e=>e?e.slice(0,7):``,r=E(new Date);return(e.inflows||[]).forEach(e=>{if(!e.active)return;let n=Number(e.amount)||0,i=e.account||`Current`,a=A(e);!a||a>r||(i===`Current`&&(t.current.salaryInflows+=n),i===`Savings`&&(t.savings.salaryInflows+=n))}),(e.payments||[]).forEach(e=>{let r=Number(e.amount)||0,i=e.account||`Current`,a=!1;a=e.recurring?e.lastPaidMonth===n(e.dueDate):!!e.paid,a&&(i===`Current`&&(t.current.paidPayments+=r),i===`Savings`&&(t.savings.paidPayments+=r))}),(e.subscriptions||[]).forEach(e=>{let r=Number(e.amount)||0,i=e.account||`Current`;e.lastPaidMonth===n(e.renewalDate)&&(i===`Current`&&(t.current.paidSubscriptions+=r),i===`Savings`&&(t.savings.paidSubscriptions+=r))}),(e.expenses||[]).forEach(e=>{let n=Number(e.amount)||0,r=e.account||`Current`;r===`Current`&&(t.current.expenses+=n),r===`Savings`&&(t.savings.expenses+=n)}),(e.transfers||[]).forEach(e=>{let n=Number(e.amount)||0;e.fromAccount===`Current`&&(t.current.transfersOut+=n),e.fromAccount===`Savings`&&(t.savings.transfersOut+=n),e.toAccount===`Current`&&(t.current.transfersIn+=n),e.toAccount===`Savings`&&(t.savings.transfersIn+=n)}),t}function ce(e){let t=Number(e.accounts?.current?.openingBalance||0),n=Number(e.accounts?.savings?.openingBalance||0),r=t,i=n,a=e=>e?e.slice(0,7):``,o=E(new Date);return(e.inflows||[]).forEach(e=>{if(!e.active)return;let t=Number(e.amount)||0,n=e.account||`Current`;if(!e.recurring){n===`Current`&&(r+=t),n===`Savings`&&(i+=t);return}let a=A(e);!a||a>o||(n===`Current`&&(r+=t),n===`Savings`&&(i+=t))}),(e.payments||[]).forEach(e=>{let t=Number(e.amount)||0,n=e.account||`Current`,o=!1;o=e.recurring?e.lastPaidMonth===a(e.dueDate):!!e.paid,o&&(n===`Current`&&(r-=t),n===`Savings`&&(i-=t))}),(e.subscriptions||[]).forEach(e=>{let t=Number(e.amount)||0,n=e.account||`Current`;e.lastPaidMonth===a(e.renewalDate)&&(n===`Current`&&(r-=t),n===`Savings`&&(i-=t))}),(e.expenses||[]).forEach(e=>{let t=Number(e.amount)||0,n=e.account||`Current`;n===`Current`&&(r-=t),n===`Savings`&&(i-=t)}),(e.transfers||[]).forEach(e=>{let t=Number(e.amount)||0,n=e.fromAccount,a=e.toAccount;n===`Current`&&(r-=t),n===`Savings`&&(i-=t),a===`Current`&&(r+=t),a===`Savings`&&(i+=t)}),{current:r,savings:i,total:r+i}}function j(e,t){D();let n=(e.inflows||[]).filter(e=>e.active).reduce((e,t)=>e+(Number(t.amount)||0),0),r=(e.subscriptions||[]).reduce((e,t)=>e+(Number(t.amount)||0),0)+(e.payments||[]).filter(e=>e.recurring).reduce((e,t)=>e+(Number(t.amount)||0),0),i=(e.payments||[]).filter(e=>!e.recurring&&O(e.dueDate)).reduce((e,t)=>e+(Number(t.amount)||0),0),a=(e.expenses||[]).filter(e=>O(e.date)).reduce((e,t)=>e+(Number(t.amount)||0),0),o=r+i+a,s=n||t,c=s-o,l=Math.max(c,0),u=s>0?o/s:0,d=`Safe`;u>=.85?d=`High`:u>=.65&&(d=`Watch`);let f={};(e.expenses||[]).filter(e=>O(e.date)).forEach(e=>{k(f,e.category,e.amount)}),(e.payments||[]).filter(e=>e.recurring||O(e.dueDate)).forEach(e=>{k(f,e.category,e.amount)}),(e.subscriptions||[]).forEach(e=>{k(f,e.category,e.amount)});let p=Math.max(0,...Object.values(f)),m=Object.entries(f).map(([e,t])=>({category:e,amount:t,percentageOfExpenses:o>0?Math.round(t/o*100):0,percentageOfMax:p>0?Math.max(8,Math.round(t/p*100)):0})).sort((e,t)=>t.amount-e.amount),h=m[0]||null,g=ce(e),_=se(e),v=re(e);return{monthlyRecurring:r,oneTimePaymentsThisMonth:i,extraExpensesThisMonth:a,totalThisMonth:o,balanceLeft:c,predictedSavings:l,riskLevel:d,categoryBreakdown:m,topCategory:h,accountBalances:g,accountBreakdown:_,inflowsThisMonth:n,savingsInterestThisMonth:v}}var M=null;function N(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function P(e=0){let t=new Date;return t.setDate(t.getDate()+e),N(t)}function F(e){return`€${Number(e||0).toFixed(2)}`}function le(e){if(!e)return``;let[t,n,r]=e.split(`-`);return!t||!n||!r?e:`${r}-${n}-${t}`}function I(e){if(!e)return``;let t=N(new Date),n=P(1);return e===t?`today`:e===n?`tomorrow`:`on ${le(e)}`}function L(e){return e.replace(/\b(pay|remind me|to|every month|monthly|bill|payment|subscription|expense|spent|spend|from current|from savings)\b/gi,` `).replace(/\s+/g,` `).trim()}function R(e){let t=e.toLowerCase(),n=new Date;if(t.includes(`today`))return P(0);if(t.includes(`yesterday`))return P(-1);if(t.includes(`tomorrow`))return P(1);if(t.includes(`next week`))return P(7);if(t.includes(`next month`)){let e=new Date(n);return e.setMonth(e.getMonth()+1),N(e)}let r=t.match(/(?:on|by|date to)?\s*(\d{1,2})(st|nd|rd|th)\b/);if(!r)return``;let i=new Date(n.getFullYear(),n.getMonth(),Number(r[1]));return i<new Date(n.getFullYear(),n.getMonth(),n.getDate())&&i.setMonth(i.getMonth()+1),N(i)}function z(e){let t=(e||``).trim().toLowerCase();if(!t)return``;if(t===`today`)return P(0);if(t===`tomorrow`)return P(1);if(t===`yesterday`)return P(-1);let n=t.match(/^(\d{2})-(\d{2})-(\d{4})$/);if(n){let[,e,t,r]=n;return`${r}-${t}-${e}`}return t.match(/^(\d{4})-(\d{2})-(\d{2})$/)?t:``}function B(e){let t=e.match(/(?:€|eur\s*)?(\d+[\.,]?\d*)/i);return t?Number(t[1].replace(`,`,`.`)):0}function V(e){let t=(e||``).trim();return t?t.charAt(0).toUpperCase()+t.slice(1):``}function H(e){return(e||``).trim().toLowerCase()===`savings`?`Savings`:`Current`}function U(e,t=`expense`){let n=e.toLowerCase();return n.includes(`rent`)||n.includes(`mortgage`)?`Housing`:n.includes(`electricity`)||n.includes(`internet`)||n.includes(`water`)||n.includes(`gas`)?`Utilities`:n.includes(`netflix`)||n.includes(`spotify`)||n.includes(`youtube`)||n.includes(`subscription`)?`Subscriptions`:n.includes(`grocer`)?`Groceries`:n.includes(`food`)||n.includes(`restaurant`)||n.includes(`lunch`)||n.includes(`dinner`)||n.includes(`coffee`)?`Food`:n.includes(`uber`)||n.includes(`taxi`)||n.includes(`fuel`)||n.includes(`bus`)||n.includes(`train`)||n.includes(`transport`)?`Transport`:n.includes(`doctor`)||n.includes(`medicine`)||n.includes(`health`)?`Health`:n.includes(`shopping`)||n.includes(`amazon`)||n.includes(`clothes`)?`Shopping`:n.includes(`loan`)||n.includes(`credit card`)||n.includes(`card`)?`Debt`:n.includes(`insurance`)?`Insurance`:t===`subscription`?`Subscriptions`:`Misc`}function W(e){let t=e.toLowerCase();return t.includes(`from savings`)||t.includes(`using savings`)?`Savings`:(t.includes(`from current`)||t.includes(`using current`),`Current`)}function ue(e){let t=e.toLowerCase();if(!(t.includes(`transfer`)||t.includes(`move`)))return null;let n=B(e),r=R(e)||P(0),i=`Current`,a=`Savings`;t.includes(`from savings to current`)?(i=`Savings`,a=`Current`):t.includes(`from current to savings`)||t.includes(`to savings`)?(i=`Current`,a=`Savings`):t.includes(`to current`)&&(i=`Savings`,a=`Current`);let o=e.replace(/\b(transfer|move|from|to|current|savings)\b/gi,` `).replace(/(?:€|eur\s*)?\d+[\.,]?\d*/gi,` `).replace(/\s+/g,` `).trim();return{amount:n,date:r,fromAccount:i,toAccount:a,note:o||`Transfer`}}function de(e,t){let n=e.split(`,`).map(e=>e.trim()),r=(n[0]||``).toLowerCase();if(!r)return null;if(r===`income`){let[,e,r,i,a]=n,o=Number(e||0),s=H(r),c=z(i)||P(0),l=a||`Income`;return o?(t.inflows.unshift({id:crypto.randomUUID(),title:l,amount:o,account:s,date:c,recurring:!1,active:!0}),{changed:!0,clearInput:!0,message:`Income added: ${l} €${o.toFixed(2)} to ${s}.`}):{changed:!1,clearInput:!1,message:`Income format: Income,amount,account,date,title`}}if(r===`report`||r===`export`)return{changed:!1,clearInput:!0,action:`export_report`,message:`Generating report...`};if(r===`task`){let[,e,r]=n;if(!e)return{changed:!1,clearInput:!1,message:`Task format: Task,title,date`};let i=z(r);return t.tasks.unshift({id:crypto.randomUUID(),title:e,dueDate:i,done:!1}),M=null,{changed:!0,clearInput:!0,message:`Task added: ${e}.`}}if(r===`expense`){let[,e,r,i,a,o]=n,s=Number(e||0),c=V(r||`Misc`),l=H(i),u=z(a)||P(0),d=o||`Expense`;if(!s||!d)return{changed:!1,clearInput:!1,message:`Expense format: Expense,amount,category,account,date,title`};let f={id:crypto.randomUUID(),title:d,date:u,amount:s,category:c,account:l};return t.expenses.unshift(f),M={type:`expenses`,id:f.id},{changed:!0,clearInput:!0,message:`Expense added: ${d} ${F(s)} from ${l}.`}}if(r===`payment`){let[,e,r,i,a,o]=n,s=Number(e||0),c=V(r||`Misc`),l=H(i),u=z(a)||P(7),d=o||`Payment`;if(!s||!d)return{changed:!1,clearInput:!1,message:`Payment format: Payment,amount,category,account,date,title`};let f={id:crypto.randomUUID(),title:d,dueDate:u,amount:s,category:c,account:l,recurring:!1,recurrenceDay:null,lastPaidMonth:``,paid:!1,paidOn:``};return t.payments.unshift(f),M={type:`payments`,id:f.id},{changed:!0,clearInput:!0,message:`Payment added: ${d} ${F(s)} from ${l}.`}}if(r===`subscription`){let[,e,r,i,a,o]=n,s=Number(e||0),c=V(r||`Subscriptions`),l=H(i),u=z(a)||P(30),d=o||`Subscription`;if(!s||!d)return{changed:!1,clearInput:!1,message:`Subscription format: Subscription,amount,category,account,date,title`};let f={id:crypto.randomUUID(),title:d,renewalDate:u,amount:s,category:c,account:l,recurring:!0,recurrenceDay:new Date(`${u}T00:00:00`).getDate(),lastPaidMonth:``};return t.subscriptions.unshift(f),M={type:`subscriptions`,id:f.id},{changed:!0,clearInput:!0,message:`Subscription added: ${d} ${F(s)} from ${l}.`}}if(r===`transfer`){let[,e,r,i,a,o]=n,s=Number(e||0),c=H(r),l=H(i),u=l===c?c===`Current`?`Savings`:`Current`:l,d=z(a)||P(0),f=o||`Transfer`;if(!s)return{changed:!1,clearInput:!1,message:`Transfer format: Transfer,amount,fromAccount,toAccount,date,note`};let p={id:crypto.randomUUID(),fromAccount:c,toAccount:u,date:d,amount:s,note:f};return t.transfers.unshift(p),M={type:`transfers`,id:p.id},{changed:!0,clearInput:!0,message:`Transfer added: ${F(s)} from ${c} to ${u}.`}}return null}function fe(e){if(!M?.type||!M?.id)return null;let t=e[M.type];if(!Array.isArray(t))return null;let n=t.find(e=>e.id===M.id);return n?{type:M.type,item:n}:null}function G(e,t){return e===`transfers`?t.note||`Transfer`:t.title||`Item`}function pe(e,t){let n=e.toLowerCase().trim(),r=fe(t);if(!r)return null;let{type:i,item:a}=r;if(n===`delete that`||n===`remove that`||n===`undo that`){t[i]=t[i].filter(e=>e.id!==a.id);let e=G(i,a);return M=null,{changed:!0,clearInput:!0,message:`Removed ${e}.`}}if(n.includes(`from current`)||n.includes(`from savings`)||n===`current`||n===`savings`||n.startsWith(`no`)){let t=W(e);return i===`transfers`?(a.fromAccount=t,a.toAccount=t===`Current`?`Savings`:`Current`,M={type:i,id:a.id},{changed:!0,clearInput:!0,message:`Got it — transfer now from ${a.fromAccount} to ${a.toAccount}.`}):(a.account=t,M={type:i,id:a.id},{changed:!0,clearInput:!0,message:`Got it — ${G(i,a)} will use ${t}.`})}if(n.startsWith(`change that to`)||n.startsWith(`make that`)||n.startsWith(`change amount to`)){let t=B(e);return t?(a.amount=t,M={type:i,id:a.id},{changed:!0,clearInput:!0,message:`Done — ${G(i,a)} is now ${F(t)}.`}):{changed:!1,clearInput:!1,message:`I could not find the new amount.`}}if(n.startsWith(`change date to`)||n.startsWith(`move that to`)||n.startsWith(`set date to`)){let t=R(e);return t?(i===`payments`&&(a.dueDate=t),i===`subscriptions`&&(a.renewalDate=t),i===`expenses`&&(a.date=t),i===`transfers`&&(a.date=t),i===`payments`&&a.recurring&&(a.recurrenceDay=new Date(`${t}T00:00:00`).getDate()),i===`subscriptions`&&(a.recurrenceDay=new Date(`${t}T00:00:00`).getDate()),M={type:i,id:a.id},{changed:!0,clearInput:!0,message:`Moved ${G(i,a)} to ${I(t)}.`}):{changed:!1,clearInput:!1,message:`I could not understand the new date.`}}return null}function me({text:e,state:t,salary:n}){let r=e.trim();if(!r)return{changed:!1,clearInput:!1,message:`Type something first.`};let i=de(r,t);if(i)return i;let a=pe(r,t);if(a)return a;let o=r.toLowerCase(),s=o.includes(`every month`)||o.includes(`monthly`),c=B(r),l=R(r),u=W(r);if(o.includes(`save`)||o.includes(`savings`)){let e=j(t,n);return{changed:!1,clearInput:!1,message:`You’re on track to save ${F(e.predictedSavings)} this month. Projected leftover: ${F(e.balanceLeft)}.`}}if(o.includes(`due this week`))return{changed:!1,clearInput:!1,message:`Check Today Mode and the payments list for the current weekly view.`};let d=ue(r);if(d&&d.amount>0&&d.fromAccount!==d.toAccount){let e={id:crypto.randomUUID(),fromAccount:d.fromAccount,toAccount:d.toAccount,date:d.date,amount:d.amount,note:d.note};return t.transfers.unshift(e),M={type:`transfers`,id:e.id},{changed:!0,clearInput:!0,message:`Moved ${F(d.amount)} from ${d.fromAccount} to ${d.toAccount} (${I(d.date)}).`}}if(o.includes(`grocer`)||o.includes(`expense`)||o.includes(`spent`)||o.includes(`shopping`)||o.includes(`food`)||o.includes(`transport`)||o.includes(`coffee`)||o.includes(`lunch`)||o.includes(`dinner`)){let e=L(r.replace(/(?:€|eur\s*)?\d+[\.,]?\d*/gi,``))||`Expense`,n={id:crypto.randomUUID(),title:e,date:l||P(0),amount:c,category:U(r,`expense`),account:u};return t.expenses.unshift(n),M={type:`expenses`,id:n.id},{changed:!0,clearInput:!0,message:`Logged ${F(c)} for ${e} from ${u} (${I(l||P(0))}).`}}if(o.includes(`netflix`)||o.includes(`spotify`)||o.includes(`subscription`)||s&&!o.includes(`pay`)&&!o.includes(`rent`)){let e=L(r.replace(/(?:€|eur\s*)?\d+[\.,]?\d*/gi,``))||`Subscription`,n={id:crypto.randomUUID(),title:e,renewalDate:l||P(30),amount:c,recurring:!0,recurrenceDay:new Date(`${l||P(30)}T00:00:00`).getDate(),lastPaidMonth:``,category:U(r,`subscription`),account:u};return t.subscriptions.unshift(n),M={type:`subscriptions`,id:n.id},{changed:!0,clearInput:!0,message:`Started ${e} at ${F(c)} from ${u}, renewing ${I(l||P(30))}.`}}if(o.includes(`pay`)||o.includes(`bill`)||o.includes(`card`)||o.includes(`rent`)||o.includes(`loan`)||o.includes(`insurance`)){let e=L(r.replace(/(?:€|eur\s*)?\d+[\.,]?\d*/gi,``))||`Payment`,n={id:crypto.randomUUID(),title:e,dueDate:l||P(7),amount:c,recurring:s,recurrenceDay:s?new Date(`${l||P(7)}T00:00:00`).getDate():null,lastPaidMonth:``,paid:!1,paidOn:``,category:U(r,`payment`),account:u};return t.payments.unshift(n),M={type:`payments`,id:n.id},{changed:!0,clearInput:!0,message:`Scheduled ${e} for ${F(c)} from ${u} (${I(l||P(7))}).`}}return t.tasks.unshift({id:crypto.randomUUID(),title:L(r)||r,dueDate:l,done:!1}),M=null,{changed:!0,clearInput:!0,message:`Task added.`}}async function he(e){`Notification`in window&&(e.notificationsEnabled=await Notification.requestPermission()===`granted`)}function ge({state:e,settings:t}){if(!(`Notification`in window)||Notification.permission!==`granted`)return;let n=Number(t.reminderDays||0),r=v(new Date);[...e.payments.filter(e=>!w(e)).map(e=>({id:e.id,type:`payment`,title:e.title,date:e.dueDate})),...e.subscriptions.filter(e=>!T(e)).map(e=>({id:e.id,type:`subscription`,title:e.title,date:e.renewalDate})),...e.tasks.filter(e=>!e.done).map(e=>({id:e.id,type:`task`,title:e.title,date:e.dueDate}))].filter(e=>e.date).forEach(e=>{let i=y(e.date),a=i===n||i===0,o=`${r}:${e.type}:${e.id}:${i}`;if(!a||t.sentReminderKeys[o])return;let s=i===0?`due today`:`due in ${i} day(s)`;new Notification(`Personal Ops Reminder`,{body:`${e.title} is ${s}.`}),t.sentReminderKeys[o]=!0})}function K(e,t=`EUR`){return new Intl.NumberFormat(void 0,{style:`currency`,currency:t,maximumFractionDigits:2}).format(Number(e||0))}function q(e){if(!e)return``;let[t,n,r]=e.split(`-`);return!t||!n||!r?e:`${r}-${n}-${t}`}function J(e){return e===null?[`No date`,`blue`]:e<0?[`${Math.abs(e)} day(s) overdue`,`danger`]:e===0?[`Due today`,`danger`]:e<=2?[`Due in ${e} day(s)`,`danger`]:e<=7?[`Due in ${e} day(s)`,`warn`]:[`Due in ${e} day(s)`,`ok`]}function _e(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function ve(e,t){let n=new Date(e,t+1,0);for(;n.getDay()!==4;)n.setDate(n.getDate()-1);return _e(n)}function Y(e,t){return t?K(e):`******`}function ye(e){if(!(e.inflows||[]).find(e=>e.title===`Salary`&&e.active))return``;let t=new Date,n=t.toISOString().split(`T`)[0],r=ve(t.getFullYear(),t.getMonth()),i=r<=n;return`
    <div class="finance-box">
      <div class="section-head"><h3>Salary</h3></div>
      <div class="finance-grid">
        <div class="finance-metric">
          <div class="label">Next credit</div>
          <div class="value">${q(r)}</div>
        </div>
        <div class="finance-metric">
          <div class="label">Status</div>
          <div class="value ${i?`ok`:`warn`}">
            ${i?`Credited`:`Pending`}
          </div>
        </div>
      </div>
    </div>
  `}function X(e,t,n,r=``){return`
    <div class="item">
      <div class="item-main">
        <h4>${e}</h4>
        <div class="meta">${t}</div>
        <div class="badges">${r}</div>
      </div>
      <div>${n}</div>
    </div>
  `}function be(e){let t=[],n=[],r=[];return e.payments.forEach(e=>{if(w(e))return;let i=y(e.dueDate),a=`${e.title} (${K(e.amount)})`;i===0?t.push(a):i>0&&i<=2&&n.push(a),i!==null&&i>=0&&i<=3&&r.push(`Payment: ${a}`)}),e.subscriptions.forEach(e=>{if(T(e))return;let i=y(e.renewalDate),a=`${e.title} (${K(e.amount)})`;i===0?t.push(a):i>0&&i<=2&&n.push(a),i!==null&&i>=0&&i<=3&&r.push(`Subscription: ${a}`)}),e.tasks.filter(e=>!e.done).forEach(e=>{let r=y(e.dueDate);r===0?t.push(e.title):r>0&&r<=2&&n.push(e.title)}),{today:t.join(` • `)||`Nothing due today.`,soon:n.join(` • `)||`Nothing urgent in the next 2 days.`,priority:r.slice(0,3).join(` • `)||`No high pressure items.`}}function xe(e){let t=new Date().toISOString().slice(0,7),n={};e.expenses.filter(e=>e.date&&e.date.startsWith(t)).forEach(e=>{let t=e.category||`Misc`;n[t]=(n[t]||0)+(Number(e.amount)||0)}),e.payments.forEach(e=>{if(!(e.recurring||e.dueDate&&e.dueDate.startsWith(t)))return;let r=e.category||`Misc`;n[r]=(n[r]||0)+(Number(e.amount)||0)}),e.subscriptions.forEach(e=>{let t=e.category||`Subscriptions`;n[t]=(n[t]||0)+(Number(e.amount)||0)});let r=Object.entries(n).map(([e,t])=>({category:e,amount:t})).sort((e,t)=>t.amount-e.amount);if(!r.length)return`
      <div class="finance-box">
        <div class="section-head"><h3>Category insights</h3></div>
        <div class="small-note">No category data for this month yet.</div>
      </div>
    `;let i=r.reduce((e,t)=>e+t.amount,0),a=Math.max(...r.map(e=>e.amount)),o=r[0];return`
    <div class="finance-box">
      <div class="section-head"><h3>Category insights</h3></div>
      <div class="small-note">
        Top category this month: <strong>${o.category}</strong>
        (${K(o.amount)})
      </div>

      <div class="category-chart">
        ${r.map(e=>{let t=i>0?Math.round(e.amount/i*100):0,n=a>0?Math.max(8,Math.round(e.amount/a*100)):0;return`
            <div class="category-row">
              <div class="category-row-top">
                <span>${e.category}</span>
                <span>${K(e.amount)} · ${t}%</span>
              </div>
              <div class="category-bar-track">
                <div class="category-bar-fill" style="width: ${n}%"></div>
              </div>
            </div>
          `}).join(``)}
      </div>
    </div>
  `}function Se(e,t,n){let r=e.accountBalances||{current:0,savings:0,total:0},i=t.accounts?.asOfDate||new Date().toISOString().slice(0,10);return`
    <div class="finance-box">
      <div class="section-head"><h3>Account tally</h3></div>
      <div class="small-note">
        Running balances based on opening balances and tracked movements from your start date.
      </div>

      <div class="finance-grid">
        <div class="finance-metric">
          <div class="label">Current account</div>
          <div class="value">${Y(r.current,n.salaryUnlocked)}</div>
        </div>
        <div class="finance-metric">
          <div class="label">Savings account</div>
          <div class="value">${Y(r.savings,n.salaryUnlocked)}</div>
        </div>
        <div class="finance-metric">
          <div class="label">Total cash</div>
          <div class="value">${Y(r.total,n.salaryUnlocked)}</div>
        </div>
        <div class="finance-metric">
          <div class="label">Interest this month</div>
          <div class="value">${K(e.savingsInterestThisMonth||0)}</div>
        </div>
        <div class="finance-metric">
          <div class="label">Tracking from</div>
          <div class="value">${q(i)}</div>
        </div>
      </div>

      
    </div>
  `}function Ce(e){let t=[...e.transfers||[]].sort((e,t)=>(t.date||``).localeCompare(e.date||``));return t.length?t.map(e=>X(e.note||`Account transfer`,`${q(e.date)} · ${K(e.amount)} · ${e.fromAccount} → ${e.toAccount}`,`<button class="secondary" data-remove="transfers:${e.id}">Delete</button>`,`<span class="badge blue">Transfer</span>`)).join(``):`<div class="empty">No transfers yet.</div>`}function we({state:e,settings:t,finance:n,today:r,config:i}){let a=be(e),o=xe(e),s=Se(n,e,t),c=Ce(e),l=e.tasks.filter(e=>!e.done).length,u=e.tasks.some(e=>{let t=y(e.dueDate);return!e.done&&t!==null&&t>=0&&t<=2}),d=[...e.tasks.filter(e=>!e.done).map(e=>e.dueDate),...e.payments.filter(e=>!w(e)).map(e=>e.dueDate),...e.subscriptions.filter(e=>!T(e)).map(e=>e.renewalDate)].filter(Boolean).filter(e=>{let t=y(e);return t>=0&&t<=7}).length,f=e.payments.filter(e=>!w(e)),p=f.length?f.map(e=>{let[t,n]=J(y(e.dueDate));return X(e.title,`${q(e.dueDate)} · ${K(e.amount)} · ${e.category||`Misc`} · ${e.account||`Current`}`,`<button class="success" data-mark-payment-paid="${e.id}">Mark paid</button><div style="height:8px"></div><button class="secondary" data-remove="payments:${e.id}">Delete</button>`,`<span class="badge ${n}">${t}</span>${e.recurring?`<span class="badge blue">Monthly repeat</span>`:``}`)}).join(``):`<div class="empty">No unpaid payments right now.</div>`,m=e.tasks.length?e.tasks.map(e=>{let t=y(e.dueDate),[n,r]=J(t);return`
          <div class="item${!e.done&&t!==null&&t>=0&&t<=2?` task-urgent`:``}">
            <div class="item-main">
              <h4><span class="${e.done?`strike`:``}">${e.title}</span></h4>
              <div class="meta">${e.dueDate?`Due ${q(e.dueDate)}`:`No due date`}</div>
              <div class="badges"><span class="badge ${r}">${n}</span></div>
            </div>
            <div>
              <button class="secondary" data-toggle-task="${e.id}">${e.done?`Undo`:`Done`}</button>
              <div style="height:8px"></div>
              <button class="secondary" data-remove="tasks:${e.id}">Delete</button>
            </div>
          </div>
        `}).join(``):`<div class="empty">No tasks yet.</div>`,h=e.subscriptions.length?e.subscriptions.map(e=>{let[t,n]=J(y(e.renewalDate)),r=T(e)?`<span class="badge ok">Paid this cycle</span>`:``;return X(e.title,`Renews ${q(e.renewalDate)} · ${K(e.amount)}/month · ${e.category||`Subscriptions`} · ${e.account||`Current`}`,`<button class="success" data-mark-subscription-paid="${e.id}">Mark paid</button><div style="height:8px"></div><button class="secondary" data-remove="subscriptions:${e.id}">Delete</button>`,`<span class="badge ${n}">${t}</span><span class="badge blue">Monthly repeat</span>${r}`)}).join(``):`<div class="empty">No subscriptions yet.</div>`,g=e.expenses.length?e.expenses.map(e=>X(e.title,`${q(e.date)} · ${K(e.amount)} · ${e.category} · ${e.account||`Current`}`,`<button class="secondary" data-remove="expenses:${e.id}">Delete</button>`,`<span class="badge warn">One-time expense</span>`)).join(``):`<div class="empty">No extra expenses yet.</div>`,_=t.salaryUnlocked?K(i.monthlySalary):`******`,v=t.salaryUnlocked?`Salary visible.`:t.salaryMessage||`Salary hidden.`;return`
    <div class="app">
      <section class="hero">
        <div>
          <h1>${i.appName}</h1>
          <p>Your personal assistant for tasks, bills, subscriptions, one-time expenses, monthly balance, and savings prediction.</p>
        </div>
        <div class="hero-right">
          <div class="date">${r.toLocaleDateString(void 0,{weekday:`long`,year:`numeric`,month:`long`,day:`numeric`})}</div>
          <div>
            <div class="headline">${a.priority===`No high pressure items.`?`All clear`:`Focus needed`}</div>
            <div class="sub">${a.priority}</div>
          </div>
        </div>
      </section>

      <section class="top-grid">
        <div class="stat ${u?`stat-urgent`:``}">
          <div class="label">Open tasks</div>
          <div class="value">${l}</div>
        </div>
        <div class="stat"><div class="label">Due this week</div><div class="value">${d}</div></div>
        <div class="stat"><div class="label">Monthly recurring</div><div class="value">${K(n.monthlyRecurring)}</div></div>
        <div class="stat"><div class="label">This month spend</div><div class="value">${K(n.totalThisMonth)}</div></div>
        <div class="stat"><div class="label">Predicted savings</div><div class="value">${K(n.predictedSavings)}</div></div>
      </section>

      <section class="layout">
        <div>
          <div class="panel">
            <h2>Today mode</h2>
            <div class="panel-sub">Focus on what matters right now instead of scanning everything.</div>
            <div class="today-box">
              <div class="today-grid">
                <div class="today-card"><h4>Due today</h4><div class="small-note">${a.today}</div></div>
                <div class="today-card"><h4>Next 2 days</h4><div class="small-note">${a.soon}</div></div>
                <div class="today-card"><h4>Top priority</h4><div class="small-note">${a.priority}</div></div>
              </div>
            </div>
          </div>

          <div class="panel">
            <h2>Assistant</h2>
            <div class="panel-sub">Try natural input for payments, subscriptions, expenses, or savings questions.</div>
            <div class="assistant-box">
              <div class="assistant-row">
                <input id="assistantInput" type="text" placeholder="Type command, e.g. Expense,5,Food,Current,today,Coffee" />
                <button id="assistantBtn">Send</button>
              </div>
              <div class="chips">
                <button class="chip" data-fill="Income,500,Current,today,Tax refund">Add income</button>
                <button class="chip" data-fill="Expense,5,Food,Current,today,Coffee">Expense example</button>
                <button class="chip" data-fill="Payment,200,Insurance,Current,25-04-2026,Car insurance">Payment example</button>
                <button class="chip" data-fill="Subscription,12.99,Subscriptions,Current,05-05-2026,Netflix">Subscription example</button>
                <button class="chip" data-fill="Transfer,300,Current,Savings,today,Monthly savings">Transfer example</button>
                <button class="chip" data-fill="Task,Book dentist,20-04-2026">Task example</button>
              </div>
              <div class="small-note" id="assistantFeedback"></div>        
            </div>

            

            <div class="section">
              <div class="section-head"><h3>Upcoming payments</h3></div>
              <div class="list">${p}</div>
            </div>

            <div class="section">
              <div class="section-head"><h3>Tasks</h3><button class="secondary" id="clearDoneBtn">Clear done</button></div>
              <div class="list">${m}</div>
            </div>
          </div>

          <div class="panel">
            <div class="section-head"><h2>Expenses & subscriptions</h2></div>
            <div class="panel-sub">Recurring services, one-time expenses, and mark-as-paid workflow.</div>
            <div class="mini-grid">${h}</div>
            <div class="section">
              <div class="section-head"><h3>Extra expenses</h3></div>
              <div class="mini-grid">${g}</div>
            </div>
          </div>

        </div>

        <div class="right-stack">
          <div class="panel">
            <h2>Financial view</h2>
            <div class="panel-sub">Monthly salary is masked by default. Enter your 6-digit PIN to reveal it.</div>
            <div class="salary-box">
              <div class="salary-grid">
                <div>
                  <div class="small-note">Monthly salary</div>
                  <div id="salaryDisplay" class="finance-metric value ${t.salaryUnlocked?``:`masked`}">${_}</div>
                </div>
                <div>
                  <div class="small-note">Reveal salary</div>
                  <div class="three-col">
                    <input id="salaryPinInput" type="password" inputmode="numeric" maxlength="6" placeholder="6-digit PIN" />
                    <button id="unlockSalaryBtn">Unlock</button>
                    <button id="lockSalaryBtn" class="secondary">Lock</button>
                  </div>
                </div>
              </div>
              <div class="small-note" id="salaryStatus">${v}</div>
            </div>

            <div class="finance-box">
              <div class="finance-grid">
                <div class="finance-metric"><div class="label">Monthly recurring</div><div class="value">${K(n.monthlyRecurring)}</div></div>
                <div class="finance-metric"><div class="label">Extra expenses</div><div class="value">${K(n.extraExpensesThisMonth)}</div></div>
                <div class="finance-metric"><div class="label">Total this month</div><div class="value">${K(n.totalThisMonth)}</div></div>
                <div class="finance-metric"><div class="label">Projected Balance</div><div class="value">${Y(n.balanceLeft,t.salaryUnlocked)}</div></div>
                <div class="finance-metric"><div class="label">Predicted savings</div><div class="value">${K(n.predictedSavings)}</div></div>
                <div class="finance-metric"><div class="label">Risk level</div><div class="value">${n.riskLevel}</div></div>
              </div>
            </div>
            
            ${ye(e)}
            ${s}
            ${o}
          </div>

          <div class="panel">
            <h2>Transfers</h2>
            <div class="panel-sub">Move money between Current and Savings without counting it as spending.</div>

            <div class="quick-add">
              <div class="row">
                <select id="transferFromAccount">
                  <option value="Current">Current</option>
                  <option value="Savings">Savings</option>
                </select>
                <select id="transferToAccount">
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
              </div>

              <div class="row">
                <input id="transferDate" type="date" />
                <input id="transferAmount" type="number" min="0" step="0.01" placeholder="Amount" />
              </div>

              <input id="transferNote" type="text" placeholder="Note (optional)" />

              <div class="row">
                <div></div>
                <button id="addTransferBtn">Add transfer</button>
              </div>
            </div>

            <div class="section">
              <div class="section-head"><h3>Transfer history</h3></div>
              <div class="mini-grid">${c}</div>
            </div>
          </div>

          <div class="panel">
            <h2>Quick add</h2>
            <div class="panel-sub">Add tasks, payments, subscriptions, and one-time expenses.</div>
            <div class="quick-add">
              <input id="taskTitle" type="text" placeholder="Task title" />
              <div class="row">
                <input id="taskDate" type="date" />
                <button id="addTaskBtn">Add task</button>
              </div>

              <input id="paymentTitle" type="text" placeholder="Payment title" />
              <div class="row">
                <input id="paymentDate" type="date" />
                <input id="paymentAmount" type="number" min="0" step="0.01" placeholder="Amount" />
              </div>
              <div class="row">
                <select id="paymentCategory">
                  <option value="Misc">Misc</option>
                  <option value="Housing">Housing</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Debt">Debt</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Transport">Transport</option>
                </select>
                <select id="paymentAccount">
                  <option value="Current">Current</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
              <div class="row">
                <select id="paymentRecurring">
                  <option value="false">One-time payment</option>
                  <option value="true">Repeat monthly</option>
                </select>
                <div></div>
              </div>

              <div class="row">
                <div></div>
                <button id="addPaymentBtn">Add payment</button>
              </div>

              <input id="subscriptionTitle" type="text" placeholder="Subscription name" />
              <div class="row">
                <input id="subscriptionDate" type="date" />
                <input id="subscriptionAmount" type="number" min="0" step="0.01" placeholder="Monthly amount" />
              </div>
              <div class="row">
                <select id="subscriptionCategory">
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Health">Health</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Misc">Misc</option>
                </select>
                <select id="subscriptionAccount">
                  <option value="Current">Current</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
              <div class="row">
                <div></div>
                <button id="addSubscriptionBtn">Add subscription</button>
              </div>

              <input id="expenseTitle" type="text" placeholder="Extra expense name" />
              <div class="row">
                <input id="expenseDate" type="date" />
                <input id="expenseAmount" type="number" min="0" step="0.01" placeholder="Amount" />
              </div>
              <div class="row">
                <select id="expenseCategory">
                  <option value="Misc">Misc</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Transport">Transport</option>
                  <option value="Food">Food</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                </select>
                <select id="expenseAccount">
                  <option value="Current">Current</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
              <div class="row">
                <div></div>
                <button id="addExpenseBtn">Add expense</button>
              </div>
            </div>
          </div>

          <div class="panel">
            <h2>Reminder settings</h2>
            <div class="panel-sub">Enable browser alerts and choose how many days before due date you want a reminder.</div>
            <div class="settings-box">
              <div class="settings-grid">
                <select id="reminderDaysSelect">
                  <option value="0" ${t.reminderDays===0?`selected`:``}>On the same day</option>
                  <option value="1" ${t.reminderDays===1?`selected`:``}>1 day before</option>
                  <option value="2" ${t.reminderDays===2?`selected`:``}>2 days before</option>
                  <option value="3" ${t.reminderDays===3?`selected`:``}>3 days before</option>
                  <option value="5" ${t.reminderDays===5?`selected`:``}>5 days before</option>
                  <option value="7" ${t.reminderDays===7?`selected`:``}>7 days before</option>
                </select>
                <button id="enableNotificationsBtn">Enable notifications</button>
              </div>
              <div class="small-note" id="notificationStatus">${`Notification`in window?Notification.permission===`granted`?`Notifications are on. Reminding ${t.reminderDays} day(s) before due date.`:`Notifications are available but not enabled yet.`:`This browser does not support notifications.`}</div>
            </div>
          </div>

          <div class="panel">
            <h2>Backup</h2>
            <p class="panel-sub">Download or restore your local data.</p>

            <div class="quick-add">
              <button id="downloadBackupBtn">Download backup</button>
              <input id="restoreBackupInput" type="file" accept=".json,application/json" />
              <button id="restoreBackupBtn" class="secondary">Restore backup</button>
              <div class="small-note" id="backupStatus">No backup action yet.</div>
            </div>
          </div>

          

          
        </div>
      </section>
    </div>
  `}function Te(){let e=new Date;return`${e.getFullYear()}${String(e.getMonth()+1).padStart(2,`0`)}${String(e.getDate()).padStart(2,`0`)}_${String(e.getHours()).padStart(2,`0`)}${String(e.getMinutes()).padStart(2,`0`)}${String(e.getSeconds()).padStart(2,`0`)}`}function Ee(){let t={version:1,exportedAt:new Date().toISOString(),data:JSON.parse(localStorage.getItem(e.storageKey)||`{}`),settings:JSON.parse(localStorage.getItem(e.settingsKey)||`{}`)},n=new Blob([JSON.stringify(t,null,2)],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`PersonalFinanceData_BackUp_${Te()}.json`,i.click(),URL.revokeObjectURL(r)}async function De(t){if(!t)throw Error(`No file selected`);let n=await t.text(),r=JSON.parse(n);if(!r.data||!r.settings)throw Error(`Invalid backup file`);localStorage.setItem(e.storageKey,JSON.stringify(r.data)),localStorage.setItem(e.settingsKey,JSON.stringify(r.settings))}var Z=m(f()),Q=g();function $(){let t=j(Z,e.monthlySalary),n=document.getElementById(`app`);n.innerHTML=we({state:Z,settings:Q,finance:t,today:new Date,config:e}),Oe(),h(Z),_(Q),ge({state:Z,settings:Q})}function Oe(){document.getElementById(`assistantBtn`)?.addEventListener(`click`,ke),document.getElementById(`assistantInput`)?.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),ke())}),document.getElementById(`exportBalanceSheetBtn`)?.addEventListener(`click`,()=>{let t=document.getElementById(`exportStatus`);try{c(Z,j(Z,e.monthlySalary)),t&&(t.textContent=`Balance sheet exported.`)}catch(e){t&&(t.textContent=`Export failed.`),console.error(e)}}),document.querySelectorAll(`[data-fill]`).forEach(e=>{e.addEventListener(`click`,()=>{document.getElementById(`assistantInput`).value=e.dataset.fill})}),document.getElementById(`addTaskBtn`)?.addEventListener(`click`,()=>{let e=document.getElementById(`taskTitle`).value.trim(),t=document.getElementById(`taskDate`).value;e&&(Z.tasks.unshift({id:crypto.randomUUID(),title:e,dueDate:t,done:!1}),$())}),document.getElementById(`addPaymentBtn`)?.addEventListener(`click`,()=>{let e=document.getElementById(`paymentTitle`).value.trim(),t=document.getElementById(`paymentDate`).value,n=Number(document.getElementById(`paymentAmount`).value||0),r=document.getElementById(`paymentCategory`).value,i=document.getElementById(`paymentAccount`).value,a=document.getElementById(`paymentRecurring`).value===`true`;!e||!t||(Z.payments.unshift({id:crypto.randomUUID(),title:e,dueDate:t,amount:n,category:r,account:i,recurring:a,recurrenceDay:a?new Date(`${t}T00:00:00`).getDate():null,lastPaidMonth:``,paid:!1,paidOn:``}),$())}),document.getElementById(`addSubscriptionBtn`)?.addEventListener(`click`,()=>{let e=document.getElementById(`subscriptionTitle`).value.trim(),t=document.getElementById(`subscriptionDate`).value,n=Number(document.getElementById(`subscriptionAmount`).value||0),r=document.getElementById(`subscriptionCategory`).value,i=document.getElementById(`subscriptionAccount`).value;!e||!t||(Z.subscriptions.unshift({id:crypto.randomUUID(),title:e,renewalDate:t,amount:n,category:r,account:i,recurring:!0,recurrenceDay:new Date(`${t}T00:00:00`).getDate(),lastPaidMonth:``}),$())}),document.getElementById(`addExpenseBtn`)?.addEventListener(`click`,()=>{let e=document.getElementById(`expenseTitle`).value.trim(),t=document.getElementById(`expenseDate`).value,n=Number(document.getElementById(`expenseAmount`).value||0),r=document.getElementById(`expenseCategory`).value,i=document.getElementById(`expenseAccount`).value;!e||!t||!n||(Z.expenses.unshift({id:crypto.randomUUID(),title:e,date:t,amount:n,category:r,account:i}),$())}),document.getElementById(`addTransferBtn`)?.addEventListener(`click`,()=>{let e=document.getElementById(`transferFromAccount`).value,t=document.getElementById(`transferToAccount`).value,n=document.getElementById(`transferDate`).value,r=Number(document.getElementById(`transferAmount`).value||0),i=document.getElementById(`transferNote`).value.trim();e!==t&&(!n||!r||(Z.transfers.unshift({id:crypto.randomUUID(),fromAccount:e,toAccount:t,date:n,amount:r,note:i}),$()))}),document.getElementById(`clearDoneBtn`)?.addEventListener(`click`,()=>{Z.tasks=Z.tasks.filter(e=>!e.done),$()}),document.querySelectorAll(`[data-toggle-task]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.toggleTask;Z.tasks=Z.tasks.map(e=>e.id===t?{...e,done:!e.done}:e),$()})}),document.querySelectorAll(`[data-remove]`).forEach(e=>{e.addEventListener(`click`,()=>{let[t,n]=e.dataset.remove.split(`:`);Z[t]=Z[t].filter(e=>e.id!==n),$()})}),document.querySelectorAll(`[data-mark-payment-paid]`).forEach(e=>{e.addEventListener(`click`,()=>{ie(Z,e.dataset.markPaymentPaid),$()})}),document.querySelectorAll(`[data-mark-subscription-paid]`).forEach(e=>{e.addEventListener(`click`,()=>{ae(Z,e.dataset.markSubscriptionPaid),$()})}),document.getElementById(`reminderDaysSelect`)?.addEventListener(`change`,e=>{Q.reminderDays=Number(e.target.value),$()}),document.getElementById(`enableNotificationsBtn`)?.addEventListener(`click`,async()=>{await he(Q),$()}),document.getElementById(`unlockSalaryBtn`)?.addEventListener(`click`,()=>{let t=document.getElementById(`salaryPinInput`).value.trim();Q.salaryUnlocked=t===e.salaryPin,Q.salaryMessage=t===e.salaryPin?`Salary visible.`:`Wrong PIN.`,$()}),document.getElementById(`lockSalaryBtn`)?.addEventListener(`click`,()=>{Q.salaryUnlocked=!1,Q.salaryMessage=`Salary hidden.`,$()}),document.getElementById(`downloadBackupBtn`)?.addEventListener(`click`,()=>{let e=document.getElementById(`backupStatus`);try{Ee(),e&&(e.textContent=`Backup downloaded.`)}catch(t){e&&(e.textContent=`Download failed.`),console.error(t)}}),document.getElementById(`restoreBackupBtn`)?.addEventListener(`click`,async()=>{let e=document.getElementById(`backupStatus`),t=document.getElementById(`restoreBackupInput`)?.files?.[0];if(!t){e&&(e.textContent=`Select a backup file first.`);return}if(window.confirm(`This will overwrite your current local data. Continue?`))try{await De(t),e&&(e.textContent=`Backup restored. Reloading...`),window.location.reload()}catch(t){e&&(e.textContent=`Restore failed.`),console.error(t)}})}function ke(){let t=me({text:document.getElementById(`assistantInput`).value,state:Z,salary:e.monthlySalary});t.changed&&$(),t.action===`export_report`&&c(Z,j(Z,e.monthlySalary));let n=document.getElementById(`assistantFeedback`);if(n&&(n.textContent=t.message),t.clearInput){let e=document.getElementById(`assistantInput`);e&&(e.value=``)}}$();