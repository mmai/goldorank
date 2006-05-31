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
var nodeTabPanel;
var nodeRichListItem;
var nodeTabs;
var nodeTabPanels;

var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].getService(Components.interfaces.nsIRDFService);
var ds_moteurs = rdfService.GetDataSourceBlocking('chrome://goldorank/content/moteurs/listeMoteurs.rdf');
var rdf_moteurs = rdfService.GetResource('urn:goldorank:moteurs');
var rdf_langue = rdfService.GetResource('urn:goldorank:rdf#langue');
var rdf_logo_langue = rdfService.GetResource('urn:goldorank:rdf#logo_langue');
var rdf_nom = rdfService.GetResource('urn:goldorank:rdf#nom');
var rdf_logo = rdfService.GetResource('urn:goldorank:rdf#logo');
var container = Components.classes["@mozilla.org/rdf/container;1"].createInstance(Components.interfaces.nsIRDFContainer);

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
    
    nodeTabPanel = document.getElementById("tabpanel_modele");
    nodeRichListItem = document.getElementById("richlistitem_modele");
    nodeTabs = document.getElementById('lestabs');
    nodeTabPanels = document.getElementById('lestabpanels');
    
    // Construction des tabs et des moteurs � partir du fichier rdf
    container.Init(ds_moteurs, rdf_moteurs);
    var moteurs_langues = container.GetElements();
    while (moteurs_langues.hasMoreElements()){
      untab = document.createElement('tab');
      var langue = moteurs_langues.getNext();
      if (langue instanceof Components.interfaces.nsIRDFResource){
        var strLangue = ds_moteurs.GetTarget(langue, rdf_langue, true);
        var strLogolangue = ds_moteurs.GetTarget(langue, rdf_logo_langue, true);
        if (strLogolangue instanceof Components.interfaces.nsIRDFLiteral){
          strLogolangue = strLogolangue.Value;
          unlogo = document.createElement('image');
          unlogo.setAttribute('src', strLogolangue);
          untab.appendChild(unlogo);
        }
        if (strLangue instanceof Components.interfaces.nsIRDFLiteral){
          strLangue = strLangue.Value;
          unlabel = document.createElement('label');
          unlabel.setAttribute('value', strLangue);
          untab.appendChild(unlabel);
          
        }
        nodeTabs.appendChild(untab);
        
        untabpanel = nodeTabPanel.cloneNode(true);
        //untabpanel = getNodeTabpanel();
        container.Init(ds_moteurs, langue);
        lesmoteurs = container.GetElements();
        while (lesmoteurs.hasMoreElements()){
            desc_moteur = lesmoteurs.getNext();
            if (desc_moteur instanceof Components.interfaces.nsIRDFResource){
                strNom = ds_moteurs.GetTarget(desc_moteur, rdf_nom, true);
                if (strNom instanceof Components.interfaces.nsIRDFLiteral){
                  strNom = strNom.Value;
                }
                strLogo = ds_moteurs.GetTarget(desc_moteur, rdf_logo, true);
                if (strLogo instanceof Components.interfaces.nsIRDFLiteral){
                  strLogo = strLogo.Value;
                }
            }
            unrichlistitem = nodeRichListItem.cloneNode(true);
            unrichlistitem.setAttribute('name', strNom);
            unrichlistitem.setAttribute('id', desc_moteur.Value);
            unrichlistitem.firstChild.nextSibling.firstChild.setAttribute('src', strLogo);
            unrichlistitem.firstChild.nextSibling.firstChild.nextSibling.setAttribute('value', strNom);
            untabpanel.firstChild.appendChild(unrichlistitem);
        }
        nodeTabPanels.appendChild(untabpanel);
      }
    }
    nodeTabs.firstChild.selected='true';
    nodeTabPanel.setAttribute('style', 'display:none;');
    nodeRichListItem.setAttribute('style', 'display:none;');
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
}

var nodeEngine;
var listeResultats = new Array();
var trouve = 0;

var moteur;

function fulguropoing(){
    if (!trouve && (maxRank > listeResultats.length) && !stopMoteur){
        //On r�cup�re les r�sultats de la page suivante
        numPage++;
        searchURL = 'http://' + moteur.serveur + moteur.url + encodeURIComponent(searchText) + moteur.strDebutPage;
        if (moteur.parPage == 'true'){
            searchURL = searchURL + (numPage -1 + parseInt(moteur.decalageDebut));
        }
        else {
            searchURL = searchURL + (listeResultats.length + parseInt(moteur.decalageDebut));
        }
        //~ if (moteur.decalageDebut){
            //~ //R�cup�ration du num�ro de page calcul�
            //~ regex = new RegExp(moteur.strNumPage+"=([^\\s&]*)");
            //~ if ((resultats = regex.exec(searchURL))!=null){
                //~ searchURL = String(searchURL).replace(resultats[1], (parseInt(resultats[1]) + parseInt(moteur.decalageDebut)));
            //~ }
            //~ else{alert('pb offset')};
        //~ }
        pageCell.value = numPage;
        strPage = wget(searchURL);
        pageTestNext = strPage;
        trouve = moteur.getResultats(strPage);
        //On verifie qu'il y a des resultats dans les pages suivantes
        regexpHasMore = new RegExp(moteur.hasNextPage);
        nextRes = regexpHasMore.exec(pageTestNext);
        if (!nextRes){
            if (!trouve){
                rankCell.value = 'N/A';
                pageCell.value = 'N/A';
            }
            //On stoppe la recherche pour ne pas boucler ad infinitum
            interruptionMoteur();
        }
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
        urltrouvee = /http:\/\/[^'"]*/.exec(resultats[1]);
        
        //Gestion de l'encodage %3a pour les sites de type yahoo
        urlyahoo = /http%3a\/\/[^'"]*/.exec(urltrouvee);
        if (urlyahoo){
            urltrouvee = String(urlyahoo).replace('%3a',':');
        }
        
        //Gestion de voila
        urlvoila = /http%3A%2F%2F[^&]*/.exec(urltrouvee);
        if (urlvoila){
            urltrouvee = String(urlvoila).replace('%3A',':');
            urltrouvee = urltrouvee.replace(/%2F/g,'/');
        }
        
        //Gestion de MSN.com
        urlMsn = /\?http:\/\/.*/.exec(urltrouvee);
        if (urlMsn){
            urltrouvee = String(urlMsn).substr(1);
        }
        
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
            rankCell.value = '>'+maxRank;
            pageCell.value = '>'+numPage;
            break;
        }
    }
    return trouve;
}

function engineRecherche(searchText){
    numPage = 0;
    trouve = 0;
    listeResultats = new Array();
    numPage = 0;
    trouve = 0;
    moteur = this;
    setTimeout('fulguropoing()', 1);
}

function engineGetProp(prop){
    var rdf_prop = rdfService.GetResource('urn:goldorank:rdf#'+prop);
    var txtProp = ds_moteurs.GetTarget(rdfService.GetResource(nodeEngine.id), rdf_prop, true);
    if (txtProp) {
        txtProp = txtProp.QueryInterface(Components.interfaces.nsIRDFLiteral);
        if (txtProp) {
            valeur = txtProp.Value;
        }
    }
    return valeur;
}

//Constructeur
function SearchEngine(nodeEngine){
    this.nomEngine = nodeEngine.name;
    
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
        
        //Recuperation des valeurs utiles du moteur        
        this.serveur = this.getProp('serveur');
        this.nom = this.getProp('nom');
        this.url = this.getProp('url');
        //this.regexPos = this.getProp('regexPos');
        this.strDebutPage = this.getProp('strDebutPage');
        //this.taillePage = this.getProp('taillePage');
        this.decalageDebut = this.getProp('decalageDebut');
        this.parPage = this.getProp('parPage');
        
        this.resultListStart = this.getProp('resultListStart');
        this.resultListEnd = this.getProp('resultListEnd');
        this.resultItemStart = this.getProp('resultItemStart');
        this.resultItemEnd = this.getProp('resultItemEnd');
        this.strNumPage = this.getProp('strNumPage');
        this.hasNextPage = this.getProp('hasNextPage');
        
        //~ this.goldorank_offset = this.getProp('goldorank_offset');
        //~ if (!this.goldorank_offset){
            //~ this.goldorank_offset = 0;
        //~ }
        //~ this.goldorank_offsetPage = this.getProp('goldorank_offsetPage');
        //~ if (!this.goldorank_offsetPage){
            //~ this.goldorank_offsetPage = 0;
        //~ }
        this.engineInitialized = 1;
       //this.engineInitialized = (this.resultItemStart && this.resultItemEnd);
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
    
    //nodeEngine = document.getElementById('resultClassement').childNodes[3];
    nodeEngine = nodeTabPanels.childNodes[nodeTabs.selectedIndex].firstChild.childNodes[2];
    //On r�initialise l'affichage
    var moteur = nodeEngine;
    while (moteur){
        //progressCell
        moteur.childNodes[2].firstChild.value = '0';
        //rankCell
        moteur.childNodes[3].firstChild.value = '';
        //pageCell
        moteur.childNodes[4].firstChild.value = '';
        //resultsCell
        resultsCell = moteur.childNodes[5].firstChild.firstChild
        while (resultsCell.firstChild){
            resultsCell.removeChild(resultsCell.firstChild);
        }
        resultsCell.parentNode.style.display = "none";
        //Bouton stop
        if (resultsCell.parentNode.parentNode.length == 2){
            resultsCell.parentNode.parentNode.removeChild(nodeButton);
        }
        moteur = moteur.nextSibling;
    }

    var engine;
    if (nodeEngine){
        engine = new SearchEngine(nodeEngine);
        if (engine.engineInitialized){
            //On effectue la recherche
            resultsCell.parentNode.parentNode.appendChild(nodeButton);
            engine.recherche(searchText);
        }
        else nextEngine();
    }    
}

function getNodeTabpanel() {
/* renvoie la structure suivante :
<tabpanel>
  <richlistbox>
        <listhead>
            <listheader label=" " width="25" />
            <listheader label="&goldorank.goldorank.engine;" width="165" />
            <listheader label="&goldorank.goldorank.progress;" width="135" />
            <listheader label="&goldorank.goldorank.rank;" width="70px" />
            <listheader label="&goldorank.goldorank.page;" width="50px" />
            <listheader label="&goldorank.goldorank.results;" flex="1" />
          </listhead>
        <listcols>
            <listcol width="7" />
            <listcol width="160" />
            <listcol width="130" />
            <listcol width="55px" />
            <listcol width="43px" />
            <listcol flex="1" />
        </listcols>        
    </richlistbox>
</tabpanel>
*/
    nodeListheader = document.createElement('listheader');
    nodeListheader2 = nodeListheader.cloneNode(false);
    nodeListheader3 = nodeListheader.cloneNode(false);
    nodeListheader4 = nodeListheader.cloneNode(false);
    nodeListheader5 = nodeListheader.cloneNode(false);
    nodeListheader6 = nodeListheader.cloneNode(false);
    nodeListheader.setAttribute('label', ' ');
    nodeListheader.setAttribute('width', '25');
    nodeListheader2.setAttribute('label', '&goldorank.goldorank.engine;');
    nodeListheader2.setAttribute('width', '165');
    nodeListheader3.setAttribute('label', '&goldorank.goldorank.progress;');
    nodeListheader3.setAttribute('width', '135');
    nodeListheader4.setAttribute('label', '&goldorank.goldorank.rank;');
    nodeListheader4.setAttribute('width', '70px');
    nodeListheader5.setAttribute('label', '&goldorank.goldorank.page;');
    nodeListheader5.setAttribute('width', '50px');
    nodeListheader6.setAttribute('label', '&goldorank.goldorank.results;');
    nodeListheader6.setAttribute('flex', '1');
    nodeListhead = document.createElement('listhead');
    nodeListhead.appendChild(nodeListheader);
    nodeListhead.appendChild(nodeListheader2);
    nodeListhead.appendChild(nodeListheader3);
    nodeListhead.appendChild(nodeListheader4);
    nodeListhead.appendChild(nodeListheader5);
    nodeListhead.appendChild(nodeListheader6);
    nodeListcol = document.createElement("listcol");
    nodeListcol2 = nodeListcol.cloneNode(false);
    nodeListcol3 = nodeListcol.cloneNode(false);
    nodeListcol4 = nodeListcol.cloneNode(false);
    nodeListcol5 = nodeListcol.cloneNode(false);
    nodeListcol6 = nodeListcol.cloneNode(false);
    nodeListcol.setAttribute("width", "7");
    nodeListcol2.setAttribute("width", "160");
    nodeListcol3.setAttribute("width", "130");
    nodeListcol4.setAttribute("width", "55px");
    nodeListcol5.setAttribute("width", "43px");
    nodeListcol6.setAttribute("flex", "1");
    nodeListcols = document.createElement("listcols");
    nodeListcols.appendChild(nodeListcol);
    nodeListcols.appendChild(nodeListcol2);
    nodeListcols.appendChild(nodeListcol3);
    nodeListcols.appendChild(nodeListcol4);
    nodeListcols.appendChild(nodeListcol5);
    nodeListcols.appendChild(nodeListcol6);
    nodeRichlistbox = document.createElement('richlistbox');
    nodeRichlistbox.appendChild(nodeListhead);
    nodeRichlistbox.appendChild(nodeListcols);
    node = document.createElement("tabpanel");
    node.appendChild(nodeRichlistbox);
    return node;
}

function ouvreUrl(url){
    var tBrowser = opener.document.getElementById("content") ;
    tBrowser.selectedTab = tBrowser.addTab(url) ;
}