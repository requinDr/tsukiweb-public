/**
 * Nero FR proofreading helper. Run on a clean checkout of branch nero-fr-v2:
 *     node tools/helpers/nero_fr_v3_fix.cjs
 *
 * Conservative repairs to dialogue lines only (lines starting with NScripter \x60).
 * All remaining translation lines should still receive human proofreading.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const script=path.resolve(__dirname,'../../public/static/fr-nero/sources/fullscript_fr-nero.txt');
if(!fs.existsSync(script)){console.error('Script introuvable : '+script);process.exit(1);}
const old=fs.readFileSync(script,'utf8');
const dictionaryText=[
'apres=après|deja=déjà|meme=même|memes=mêmes|tres=très|plutot=plutôt|pres=près|ete=été|etait=était|etais=étais|etaient=étaient|etions=étions|etiez=étiez|etes=êtes|etre=être|voila=voilà|ca=ça|pitie=pitié',
'eprouvais=éprouvais|eprouvait=éprouvait|eprouvaient=éprouvaient|eprouvent=éprouvent|eprouve=éprouve|eprouver=éprouver|etagere=étagère|etageres=étagères|etage=étage|etages=étages|eclairage=éclairage|eclair=éclair|eclairs=éclairs|eclairer=éclairer|eclaire=éclaire|eclat=éclat|eclats=éclats|eclater=éclater|eclate=éclate',
'ecole=école|ecoles=écoles|egal=égal|egale=égale|egales=égales|egaux=égaux|egalement=également|egalite=égalité|electricite=électricité|electrique=électrique|energie=énergie|energies=énergies|enorme=énorme|enormes=énormes|enormement=énormément|epaule=épaule|epaules=épaules|epais=épais|epaisse=épaisse|epaisseur=épaisseur|epine=épine|epines=épines|epoque=époque|epreuve=épreuve|epuisant=épuisant|epuisement=épuisement|epuiser=épuiser|epuise=épuise',
'etrange=étrange|etranges=étranges|etrangement=étrangement|etranger=étranger|etrangere=étrangère|etrangers=étrangers|etrangeres=étrangères|eternel=éternel|eternelle=éternelle|eternite=éternité|etonner=étonner|etonnant=étonnant|etonnante=étonnante|etonne=étonne|evident=évident|evidente=évidente|evidemment=évidemment|eviter=éviter|evite=évite|evenement=événement|evenements=événements|evolution=évolution|evoquer=évoquer|evoque=évoque|emotion=émotion|emotions=émotions|enervement=énervement|enerver=énerver|enerve=énerve|equilibre=équilibre|equilibrer=équilibrer|enquete=enquête|eloigner=éloigner|eloigne=éloigne',
'etouffer=étouffer|etouffe=étouffe|etouffement=étouffement|epouvantable=épouvantable|epouvante=épouvante|ecouter=écouter|ecoute=écoute|ecraser=écraser|ecrase=écrase|ecrire=écrire|ecrit=écrit|ecrits=écrits|ecriture=écriture|ecrivain=écrivain|effacer=effacer|ecarter=écarter|ecarte=écarte|echapper=échapper|echappe=échappe',
'demontais=démontais|demonter=démonter|demonte=démonte|demon=démon|demons=démons|debile=débile|defaut=défaut|defauts=défauts|defense=défense|definitivement=définitivement|deformation=déformation|deformer=déformer|deforme=déforme|dechirer=déchirer|dechire=déchire|dechirent=déchirent|dechirure=déchirure|detourner=détourner|detourne=détourne|detour=détour|detruire=détruire|detruit=détruit|degats=dégâts|degat=dégât|degouter=dégoûter|degoute=dégoûte|degout=dégoût|deprime=déprime|depression=dépression|decider=décider|decide=décide|decision=décision|decouvrir=découvrir|decouvert=découvert|decouper=découper|decoupe=découpe|desordre=désordre|desespoir=désespoir|desespere=désespère|desir=désir|desirs=désirs|desirer=désirer|desire=désire|deranger=déranger|derange=dérange|derriere=derrière|derniere=dernière|desormais=désormais',
'different=différent|differente=différente|differents=différents|differentes=différentes|difference=différence|differemment=différemment|difficulte=difficulté|difficultes=difficultés|qualite=qualité|realite=réalité|verite=vérité|securite=sécurité|liberte=liberté|gravite=gravité|identite=identité|probleme=problème|problemes=problèmes|interet=intérêt|interessant=intéressant|interessante=intéressante|interesser=intéresser|interesse=intéresse|mechant=méchant|mechante=méchante|controle=contrôle|controler=contrôler',
'maitre=maître|maitresse=maîtresse|frere=frère|freres=frères|pere=père|mere=mère|premiere=première|premieres=premières|legere=légère|leger=léger|legerement=légèrement|facade=façade|garcon=garçon|lecon=leçon|recu=reçu|recue=reçue|recus=reçus|recues=reçues|reussir=réussir|reussi=réussi|reussite=réussite|reve=rêve|reves=rêves|rever=rêver|reveil=réveil|reveiller=réveiller|reveille=réveille|reflexion=réflexion|refleter=refléter|reflete=reflète|repeter=répéter|repete=répète|reglement=règlement|regler=régler|regle=règle|reunion=réunion|reunir=réunir|reparer=réparer|repare=répare|reagir=réagir|reaction=réaction|reponse=réponse|repond=répond|repondre=répondre|reperer=repérer|repere=repère',
'necessaire=nécessaire|necessite=nécessité|mecanique=mécanique|mecanisme=mécanisme|metier=métier|numero=numéro|telephone=téléphone|television=télévision|cafe=café|bebe=bébé|appetit=appétit|annee=année|matinee=matinée|soiree=soirée|fumee=fumée|aout=août|noel=noël|chateau=château|gateau=gâteau|cout=coût|couter=coûter|gout=goût|gouter=goûter|goute=goûte|arret=arrêt|arreter=arrêter|arrete=arrête|tete=tête|pret=prêt|prete=prête|proteger=protéger|protegez=protégez|protege=protège|aigue=aiguë|aneantir=anéantir|reduction=réduction|reduire=réduire|materiel=matériel|general=général|generale=générale|generalement=généralement|generation=génération|precis=précis|precise=précise|precisement=précisément|precision=précision|celebre=célèbre|celebrer=célébrer|ceremonie=cérémonie|creature=créature|colere=colère|caractere=caractère|maniere=manière|lumiere=lumière|demontrer=démontrer|inquietude=inquiétude|surement=sûrement|vulnerable=vulnérable',
'enleve=enlève|elever=élever|eleve=élève|leve=lève|mene=mène|amene=amène|emmene=emmène|achete=achète|seche=sèche|barriere=barrière|fievre=fièvre|paupieres=paupières|chaine=chaîne|entrainement=entraînement|entrainer=entraîner|entraine=entraîne|maitriser=maîtriser|naivete=naïveté|naif=naïf|naive=naïve|hair=haïr|abime=abîme|abimer=abîmer|gache=gâche|gacher=gâcher|societe=société|autorite=autorité|activite=activité|experience=expérience|extreme=extrême|extremement=extrêmement|particulierement=particulièrement|mystere=mystère|mysterieux=mystérieux|mysterieuse=mystérieuse|etiquette=étiquette|journee=journée|idee=idée|malgre=malgré|commencait=commençait|commencais=commençais|commenca=commença'
].join('|');
function table(str){return new Map(str.split('|').map(x=>x.trim().split('=')).filter(([a,b])=>a&&b&&a!==b));}
const dic=table(dictionaryText);
const participles=table(
'abandonne=abandonné|accepte=accepté|aide=aidé|aime=aimé|ajoute=ajouté|allume=allumé|amene=amené|emmene=emmené|annonce=annoncé|appelle=appelé|arrete=arrêté|attaque=attaqué|avance=avancé|baisse=baissé|blesse=blessé|bouge=bougé|cache=caché|change=changé|cherche=cherché|commence=commencé|confirme=confirmé|continue=continué|coupe=coupé|decide=décidé|dechire=déchiré|decoupe=découpé|demande=demandé|demonte=démonté|depose=déposé|derange=dérangé|detourne=détourné|deforme=déformé|deprime=déprimé|desire=désiré|dirige=dirigé|donne=donné|ecarte=écarté|eclaire=éclairé|ecoute=écouté|ecrase=écrasé|efface=effacé|eloigne=éloigné|embrasse=embrassé|enferme=enfermé|enerve=énervé|entraine=entraîné|entre=entré|envoye=envoyé|epuise=épuisé|eprouve=éprouvé|essaie=essayé|etouffe=étouffé|etonne=étonné|evite=évité|explique=expliqué|fatigue=fatigué|ferme=fermé|frappe=frappé|garde=gardé|goute=goûté|imagine=imaginé|installe=installé|invite=invité|jete=jeté|joue=joué|laisse=laissé|leve=levé|mene=mené|mange=mangé|marche=marché|montre=montré|oublie=oublié|parle=parlé|passe=passé|pense=pensé|place=placé|plonge=plongé|porte=porté|pose=posé|pousse=poussé|prepare=préparé|protege=protégé|raconte=raconté|regarde=regardé|regle=réglé|releve=relevé|rencontre=rencontré|rentre=rentré|repare=réparé|repere=repéré|repete=répété|retourne=retourné|reve=rêvé|reveille=réveillé|sauve=sauvé|seche=séché|serre=serré|termine=terminé|tire=tiré|tombe=tombé|touche=touché|tourne=tourné|trouve=trouvé|tue=tué|utilise=utilisé|vide=vidé|vole=volé'
);
const infins='abandonner acheter accepter aider aller amener appeler apprendre arriver attaquer attendre avoir battre boire bouger cacher changer chercher choisir commencer comprendre confirmer continuer courir croire décider découvrir demander devenir devoir dire discuter dormir écrire écouter effacer embrasser emmener empêcher enlever entrer essayer être éviter faire finir frapper garder imaginer jouer laisser lever lire manger marcher mourir oublier ouvrir parler passer penser perdre pleurer pouvoir prendre protéger regarder rejoindre rentrer répéter ressentir rester retourner revenir rire savoir sentir sortir sourire souffrir suivre tenir tomber toucher trouver tuer utiliser venir vivre voir vouloir'.split(' ');
const infinitivePattern=new RegExp('\\ba (?=(?:'+infins.join('|')+')\\b)','giu');
const auxiliaryPattern=/\b(ai|as|a|avons|avez|ont|avais|avait|avions|aviez|avaient|aurai|auras|aura|aurions|auriez|auraient|aurais|aurait|auront|est|suis|es|sommes|sont|serait|seraient|sera|seront)\s+([a-zà-ÿ]+)\b/giu;
const matchCase=(word,rep)=>word===word.toUpperCase()?rep.toUpperCase():word[0]===word[0].toUpperCase()?rep[0].toUpperCase()+rep.slice(1):rep;
const stats={dictionary:0,feminine_endings:0,quotes:0,prepositions:0,participles:0,relative_where:0};
let changed=0;
const newText=old.split('\n').map(line=>{
  if(line.trimStart().charCodeAt(0)!==96)return line;
  let v=line.replace(/[a-zÀ-ÖØ-öø-ÿœŒ]+/giu,w=>{
    const replacement=dic.get(w.toLowerCase());
    if(!replacement)return w;
    stats.dictionary++;return matchCase(w,replacement);
  });
  v=v.replace(/\b([a-zà-ÿ]+)ee(s?)\b/giu,(_whole,stem,plural)=>{stats.feminine_endings++;return stem+'ée'+plural;});
  // Only remove *internal* spaces between paired quotation marks. Preserve outer spaces!
  v=v.replace(/" +([^"\n]+?) +"/g,(_whole,inner)=>{stats.quotes++;return '"'+inner+'"';});
  v=v.replace(/^(\s*\x60\s*)" +/g,(_whole,pre)=>{stats.quotes++;return pre+'"';});
  v=v.replace(/ +"(?=[@\\,.;!?]|$)/g,()=>{stats.quotes++;return '"';});
  v=v.replace(infinitivePattern,()=>{stats.prepositions++;return 'à ';});
  v=v.replace(auxiliaryPattern,(whole,aux,w)=>{
    const ascii=w.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const result=participles.get(w.toLowerCase())||participles.get(ascii);
    if(!result)return whole;
    stats.participles++;return aux+' '+matchCase(w,result);
  });
  v=v.replace(/\b(l'endroit|l'instant|le moment|la fois|l'heure|le jour|la nuit|n'importe|la maison|le lieu) ou\b/giu,(_whole,prefix)=>{
    stats.relative_where++;return prefix+' où';
  });
  v=v.replace(/le visage déforme\b/giu,'le visage déformé');
  if(v!==line)changed++;
  return v;
}).join('\n');
const expected=["j'éprouvais surtout de la pitié","reviendrait à confirmer","Hisui est projetée contre l'étagère, le visage déformé",'"Nii-san, tu'];
for(const sample of expected)if(!newText.includes(sample)){console.error('Correction attendue absente: '+sample);process.exit(2);}
if(changed<100){console.error('Nombre de modifications inattendu: '+changed);process.exit(2);}
fs.writeFileSync(script,newText,'utf8');
console.log('Corrections Nero FR v3 : '+changed+' lignes modifiées.');
console.log('Détails: '+JSON.stringify(stats));
console.log('Relecture humaine encore nécessaire: certains accents et participes sont contextuels.');
