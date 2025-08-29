# PROJEKTI [PW2425]

Grupi: **Inteligjenca Natyrale**

Nga: Florenc Kulici, Klausar Vladi, Eris Hasanpapaj, Florjon Seci, Aldo Margjeka dhe Igli Arapi.

## Pershkrimi gjeneral i projektit.

Qellimi kryesor i projektit eshte te krijohet nje sistem modern, i sigurt dhe intuitiv per menaxhimin e fitness-it, i cili lejon perdoruesit te identifikohen si trajnere personale ose kliente. Sistemi do te ofroje autentifikim te sigurt, komunikim te lehte permes email-it dhe SMS, menaxhim intuitiv te klienteve, trajnereve dhe programeve te stervitjes, ngarkim dokumentesh (certifikata, foto transformimi), kerkim inteligjent, pagesa me PayPal dhe nje chatbot me AI te quajtur "carti" per pyetje ne lidhje me fitness-in edhe platformen ne gjuhen Shqipe.

## Ndarja e puneve per cdo student

Cdo student do te kete detyra specifike brenda projektit, duke u fokusuar ne pjese te ndryshme te zhvillimit:

1. **Florjon dhe Eris**: Backend - Strukturimi dhe implementimi i bazes se te dhenave.
2. **Florenc** Backend -Implementimi i autentifikimit te sigurt (OAuth, JWT),
   Ndertimi i API-ve per menaxhimin e perdoruesve (kliente & trajnere),
   Integrimi i pagesave me PayPal, Siguria dhe enkriptimi i te dhenave
3. **Klausar** AI - Ndertimi i chatbot-it “Carti” pee pyetje rreth fitness-it dhe
   platformes , Integrimi i chatbot-it me frontend-in dhe API-te
4. **Aldo** Frontend, Krijimi i faqes per regjistrimin dhe hyrjen, Integrimi i
   dizajnit responsiv per pajisje mobile, Lidhja me API-te e backend-it
5. **Igli**: Testimi i sigurise dhe "UI inconsistencies" te aplikacionit.

## Ndarja e Komponenteve

Projekti do te ndahet ne komponente te ndryshem, secili me nje funksion specifik:

1. **Regjistrimi dhe Autentifikimi**:Ky modul do te mundesoje regjistrimin dhe autentifikimin e perdoruesve bazuar ne rolet e tyre (admin, trajner, klient). Do te perdoret “JSON Web Tokens” per nje login te sigurt, duke garantuar qe cdo sesion te jete i mbrojtur nga aksese te paautorizuara. Fjalekalimet do te ruhen “encrypted” per te permiresuar sigurine. Gjithashtu, perdoruesve do t’u mundesohet rikuperimi i kredencialeve te tyre permes email-it ose SMS.
2. **Profili i Perdoruesit**: Sistemi do te ofroje panele te personalizuara sipas rolit te perdoruesit. Administratoret do te kene akses te plote per te menaxhuar trajneret, klientet dhe settings e sistemit. Trajneret do te mund te menaxhojne klientet e tyre, te krijojne programe te personalizuara te stervitjes dhe te ngarkojne dokumente te rendesishme sic jane certifikatat e tyre. Nga ana tjeter, klientet do te kene qasje ne programet e tyre te stervitjes, do te ndjekin progresin e tyre dhe do te kene mundesine te ngarkojne foto transformimi per te monitoruar zhvillimin fizik.
3. **Modulet e komunikimit**: Per te siguruar nje komunikim efikas midis trajnereve dhe klienteve, sistemi do te mbeshtese njoftimet permes email-it dhe SMS per perditesime te rendesishme si ndryshimet ne programet e stervitjes ose takimet e planifikuara duke e bere komunikimin me te lehte dhe me te shpejte.
4. **Menaxhimi i dokumenteve:** Nje modul i vecante do te merret me ruajtjen dhe menaxhimin e dokumenteve. Perdoruesit do te kene mundesine te ngarkojne dhe te ruajne certifikata, foto dhe dokumente te tjera te rendesishme brenda sistemit. Per te lehtesuar qasjen ne keto materiale, do te integrohet nje mekanizem kerkimi qe do te mundesoje gjetjen e shpejte te dokumenteve bazuar ne emrin ose kategori te caktuara.
5. **Integrimi i pagesave:** Per te lejuar blerjen e planeve te trajnimit ose abonimeve ne platforme, sistemi do te perfshije pagesat me PayPal. Kjo do te mundesoje nje pervoje te sigurt dhe te lehte per perdoruesit qe duan te kryejne pagesa online.
6. **AI chat (_carti_):** Per te ndihmuar perdoruesit me pyetje ne lidhje me ushtrimet, dieten ose aspektet e tjera te fitness-it, sistemi do te perfshije nje chatbot te fuqizuar nga OpenAI API. Ky chatbot do te jete ne gjendje te jape keshilla te personalizuara dhe te menaxhoje historikun e bisedave per te siguruar nje pervoje me te avancuar te komunikimit me perdoruesin.

## Projekti do te implementohet duke perdorur teknologjite e meposhtme:

1. **Frontend**

- HTML/cSS/JavaScript: Per ndertimin e nderfaqes se perdoruesit.
- jQuery: Perdorim minimal per manipulimin e DOM-it
- AJAX: Per kerkesat API midis frontend-it dhe backend-it.

1. **Backend**

- PHP
- MySQL: Baza e te dhenave.
- ReSTful API: Per komunikimin mes frontend-it dhe backend-it.

1. **Te tjera**

- OpenAI API: Per chatbot-in me AI (carti).
- PayPal API: Per integrimin e pagesave.
- email/SMS APIs: Per komunikimin (p.sh., Twilio per SMS, SendGrid per email).
- JWT: Per autentifikim te sigurt
