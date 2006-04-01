var progressCell;
var rankCell;
var pageCell;
var engine;
var nbRes;
var searchURL;
var numPage;
var listeResultats = [];
var currentNodeEngine;
var searchText;
var pageRecherchee;
var maxRank;

var searchSvc = Components.classes["@mozilla.org/rdf/datasource;1?name=internetsearch"].getService(Components.interfaces.nsIInternetSearchService);
var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
var ds = rdfService.GetDataSource('rdf:internetsearch');

RegExp.escape = function(text) {
  if (!arguments.callee.sRE) {
    var specials = [
      '/', '.', '*', '+', '?', '|',
      '(', ')', '[', ']', '{', '}'
    ];
    arguments.callee.sRE = new RegExp(
      '(\\' + specials.join('|\\') + ')', 'g'
    );
  }
  return text.replace(arguments.callee.sRE, '\\$1');
}

function peupleValeurs(){
    document.getElementById('motscles').value=opener.content.document.getSelection();
    document.getElementById('page').value=opener.content.document.location;
    
    //On ajoute la prise en compte des cat�gories de moteurs pour que le navigateur puisse interroger la cat�gorie Goldorank
    var ds = rdfService.GetDataSource('rdf:internetsearch');
    var catDS = ds.GetCategoryDataSource();
    if (catDS) {
        catDS = catDS.QueryInterface(Components.interfaces.nsIRDFDataSource);
        listeMoteurs = document.getElementById('resultClassement');
        listeMoteurs.database.AddDataSource(catDS);
        listeMoteurs.builder.rebuild();
    }
}

function wget(url){ 
    contenu = "";
    p = new XMLHttpRequest();
    p.onload = null;
    p.open("GET",url, false);
    p.send(null);

    if ( p.status != "200" ) {
      alert("R�ception erreur " + p.status);
    } 
    else {
      contenu=p.responseText;
    }
    return contenu;
}

var nodeButton = document.createElement('button');
nodeButton.height="25";
nodeButton.setAttribute('label', 'STOP');
nodeButton.setAttribute('oncommand', 'interruptionMoteur();');

var stopMoteur = 0;
function interruptionMoteur(){
    stopMoteur = 1;
    ouvreUrl(searchURL);
    alert(moteur.resultListStart+"\n"+moteur.resultListEnd+"\n--\n"+moteur.resultItemStart+"\n"+moteur.resultItemEnd);
}

var nodeEngine;
var listeResultats = new Array();
var trouve = 0;

var moteur;
function fulguropoing(){
    if (!trouve && (maxRank > listeResultats.length) && !stopMoteur){
        //On r�cup�re les r�sultats de la page suivante
        searchURL = searchSvc.GetInternetSearchURL(moteur.nomEngine, encodeURIComponent(searchText), 0, ++numPage, {value:0});
        pageCell.value = numPage;
        strPage = wget(searchURL);
        trouve = moteur.getResultats(strPage);
        setTimeout("fulguropoing()", 1);
    }
    else {
        resultsCell.parentNode.parentNode.removeChild(nodeButton);
        //On affiche la liste des resultats dans le combo-box
        for (var numres=0; numres<listeResultats.length; numres++){
            var nodeItem = document.createElement('menuitem');
            var urlres = listeResultats[numres];
            var urltxt = (numres+1)+' '+urlres;
            if (urltxt.length > 35){
                urltxt = urltxt.substr(0, 32) + '...';
            }
            if (numres == 0){
                resultsCell.parentNode.setAttribute('label', urltxt);
            }
            nodeItem.setAttribute('label', urltxt);
            nodeItem.setAttribute('value', urlres);
            //alert(numres+nodeItem.label);
            resultsCell.appendChild(nodeItem);
        }
        resultsCell.parentNode.style.display = "block";
        //On lance le  moteur suivant
        setTimeout("nextEngine()", 1);
    }
}

function nextEngine(){
    nodeEngine = nodeEngine.nextSibling;
    if (nodeEngine){
        //alert(nodeEngine.id);
        engine = new SearchEngine(nodeEngine);
        if (engine.engineInitialized){
            resultsCell.parentNode.parentNode.appendChild(nodeButton);
            engine.recherche(searchText);
        }
        else {
            nextEngine();
        }
    } 
}


/********** OBJET SearchEngine **************/
//Fonctions
function engineGetResultats(strPage){
    trouve = 0;
    //On r�duit la page � la zone utile
    debutZone = strPage.indexOf(this.resultListStart);
    if ( debutZone >= 0){
        strPage = strPage.substring(debutZone);
    }
    finZone = strPage.indexOf(this.resultListEnd);
    if (finZone >= 0){
        strPage = strPage.substring(0, finZone);
    }
    //On supprime les retours � la ligne
    strPage = strPage.replace(/\n/g, "");
    strPage = strPage.replace(/\r/g, "");
    //On recherche l'ensemble des resultats
    var regex = new RegExp(RegExp.escape(this.resultItemStart) + '(.*?)' + RegExp.escape(this.resultItemEnd), "g");
    while ((resultats = regex.exec(strPage))!=null){
        //Gestion de l'encodage %3a pour les sites de type yahoo
        urltrouvee = /http(?::|%3a)\/\/[^'"]*/.exec(resultats[1]);
        urltrouvee = String(urltrouvee).replace('%3a',':');
        listeResultats.push(urltrouvee);
        rankCell.value = listeResultats.length;
        //Avancement de la barre de progression
        progressCell.value = (100 * listeResultats.length / maxRank) ;
        //Est-ce que c'est l'url recherch�e?
        if (String(urltrouvee).match(regexPageCherchee)){
            progressCell.value = 100;
            trouve=1;
            break;
        }
        else if (maxRank <= listeResultats.length){
            //Fin des recherches atteintes sans avoir trouv� la page
            rankCell.value = 'N/A';
            pageCell.value = 'N/A';
            break;
        }
    }
    return trouve;
}

function engineRecherche(searchText){
    numPage = 0;
    trouve = 0;
    //~ while (!trouve && maxRank > this.listeResultats.length){
        //~ //On r�cup�re les r�sultats de la page suivante
        //~ searchURL = searchSvc.GetInternetSearchURL(this.nomEngine, encodeURIComponent(searchText), 0, ++numPage, {value:0});
        //~ pageCell.value = numPage + 1;
        //~ strPage = wget(searchURL);
        //~ alert(searchURL);
        //~ trouve = this.getResultats(strPage);
    //~ }
    //~ return this.listeResultats;
    listeResultats = new Array();
    numPage = 0;
    trouve = 0;
    moteur = this;
    setTimeout('fulguropoing()', 1);
}

function engineGetProp(prop){
    var valeur;
    var regex = new RegExp(prop+"\\s*=\\s*['\"](.*)['\"]\\s*\\n");
    res = regex.exec(this.txtEngine);
    if (res){
        valeur = res[1];
    }
    return valeur;
}

//Constructeur
function SearchEngine(nodeEngine){
    this.nomEngine = nodeEngine.id;
    //this.listeResultats = new Array();
    
   //Initialisation du contexte d'un moteur
    this.engineInitialized = 0;
    //D�termination des �l�ments xul � mettre � jour
    checkedCell = nodeEngine.childNodes[0].firstChild;
    progressCell = nodeEngine.childNodes[2].firstChild;
    rankCell = nodeEngine.childNodes[3].firstChild;
    pageCell = nodeEngine.childNodes[4].firstChild;
    resultsCell = nodeEngine.childNodes[5].firstChild.firstChild;
    
    //Initialisation des valeurs
    engine = nodeEngine.id;
    progressCell.value = 0;
    numPage = 0;
    stopMoteur = 0;
    if (checkedCell.checked){
        listeResultats = [];
        rankCell.value = '1';
        pageCell.value = '1';
        
        //D�finit  les m�thodes pour l'objet
        this.getProp = engineGetProp;
        this.recherche = engineRecherche;
        this.getResultats = engineGetResultats;
        
        //Recuperation du xml descriptif du moteur
        var rdf_data = rdfService.GetResource('http://home.netscape.com/NC-rdf#data');
        var txtEngine = ds.GetTarget(rdfService.GetResource(nodeEngine.id), rdf_data, true);
        if (txtEngine) txtEngine = txtEngine.QueryInterface(Components.interfaces.nsIRDFLiteral);
        if (txtEngine) this.txtEngine = txtEngine.Value;
        
        //Recuperation des valeurs utiles du moteur
        this.resultListStart = this.getProp('resultListStart', this.txtEngine);
        this.resultListEnd = this.getProp('resultListEnd', this.txtEngine);
        this.resultItemStart = this.getProp('resultItemStart', this.txtEngine);
        this.resultItemEnd = this.getProp('resultItemEnd', this.txtEngine);
        this.engineInitialized = (this.resultItemStart && this.resultItemEnd);
        if (!this.engineInitialized) {
            rankCell.value = 'Err';
            pageCell.value = 'Err';
            alert('pb initialisation: resultItems');
        }
    }
}

/********** FIN OBJET SearchEngine *********************/

function rechercherS(){
    //Valeurs de recherche
    searchText = document.getElementById('motscles').value;
    searchText = searchText ? searchText : "A";
    pageCherchee = document.getElementById('page').value;
    regexPageCherchee = new RegExp('(http://)?'+RegExp.escape(pageCherchee)+'/?');
    maxRank = document.getElementById('maxRank').value;
    
    //Initialisation du service de recherche et des �l�ments RDF
    var searchroot = rdfService.GetResource('NC:LastSearchRoot');
    var rdf_url = rdfService.GetResource('http://home.netscape.com/NC-rdf#URL');
    var rdf_logo = rdfService.GetResource('http://home.netscape.com/NC-rdf#Icon');
    var rdf_nom = rdfService.GetResource('http://home.netscape.com/NC-rdf#Name');
    
    nodeEngine = document.getElementById('resultClassement').childNodes[3];
    //On r�initialise l'affichage
    var moteur = nodeEngine;
    while (moteur){
        //progressCell
        moteur.childNodes[2].firstChild.value = '0';
        //rankCell
        moteur.childNodes[3].firstChild.value = '';
        //pageCell
        moteur.childNodes[4].firstChild.value = '';
        moteur = moteur.nextSibling;
    }

    var engine;
    if (nodeEngine){
        engine = new SearchEngine(nodeEngine);
        if (engine.engineInitialized){
            //On effectue la recherche
            //alert('recherche sur '+nodeEngine.id);
            resultsCell.parentNode.parentNode.appendChild(nodeButton);
            engine.recherche(searchText);
        }
        else nextEngine();
    }    
}

function ouvreUrl(url){
    var tBrowser = opener.document.getElementById("content") ;
    tBrowser.selectedTab = tBrowser.addTab(url) ;
}