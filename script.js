"use strict"

const ajaxHandlerScript="https://fe.it-academy.by/AjaxStringStorage2.php";
const stringName='MARKOVICH_LINK_NUMBER_RECORDS';
let updatePassword; // генерация пароля ( AJAX )
let nameUser; // имя пользователя для формирования таблицы рекордов

let musicPlay = false; // музыка "выключена"
let soundPlay = false; // звук "выключен"
let soundCont = document.getElementById("soundCont"); // тег <audio> со звуком
let musicCont = document.getElementById("musicCont"); // тег <audio> с музыкой

let polylineСoordinates = [{}]; // хранилище координат полилиннии
let SVGElem, polylineElem, circleElem; // элементы SVG на странице "игра"
let arrLevels; // массив уровней игры
let arrowLeftElem, arrowRightElem; // стрелки переключения уровней на странице "игра"
let arrCircle = []; // хранение элементов сircle 
let SPAState={}; 

let color = {
    beige : "#F0AD87",
    spicedApple : "#793A36",
    peach : "#FC7668",
}

let field = {          // размеры SVG на странице "игра"
    width : null,
    widthAnim : null,
}
let btn = {          // размеры кнопки переключения уровней на странице "игра"
    width : null,
    height : null,
    marginTop : null,
    marginBott : null,
}
let btnBack = {          // размеры кнопки "назад" на странице "игра"
    width : null,
    height : null,
    marginTop : null,
    marginBott : null,
}
let cell = {          // размеры элементов SVG на странице "игра"
    radius : null,
    innerRadius : null,
    strokeWidth : 2,
    rAnim : null,
}
//-----------------------------------------------------------------------------------------
// класс для управления игрой
class ElemSVGClass {
    constructor (nameLS, nameComp) {
        this.obj = {};
        this.cellNumber = 1;
        this.level;
        this.compLevel;
        this.nameLS = nameLS;
        this.nameComp = nameComp;
        this.loadCompLevel();

        let objJson = localStorage.getItem(this.nameLS);
        if (objJson) {
            this.level = JSON.parse(objJson);
        } else {
            this.level = 1;
        }
    }
    loadCompLevel () {
        let objJsonComp = localStorage.getItem(this.nameComp);
        if (objJsonComp) {
            this.compLevel = JSON.parse(objJsonComp);
        } else {
            this.compLevel = 0;
        }
    }
    addCompLevel () {
        if (this.compLevel < this.level) {
            localStorage.setItem(this.nameComp, JSON.stringify(this.level));
        }
    }
    clearObj () {
        for (let elem in this.obj) {
            delete this.obj[elem];
            }
    }
    increaseLevel () {
        if (this.level<arrLevels.length-1) {
            this.level++;
        }
    }
    decreaseLevel () {
        if (this.level>1) {
            this.level--;
        }
    }
    addLS () {
        localStorage.setItem(this.nameLS, JSON.stringify(this.level));
    }
    addCellNumber () {
        this.cellNumber++;
    }
    removeCellNumber () {
        this.cellNumber--;
    }
    resetCellNumber () {
        this.cellNumber = 1;
    }
    addObj (index) {
        this.obj[index] = {};
        this.obj[index]["status"] = false;
        this.obj[index]["obst"] = false;
        this.obj[index]["activ"] = false;
        this.obj[index]["lastActiv"] = false;
    }
    changeLastActiv (index, value) {
        this.obj[index]["lastActiv"] = value;
    }
    changeActiv (index, value) {
        this.obj[index]["activ"] = value;
    }
    addStatus (index, value) {
        this.obj[index]["status"] = value;
    }
    addObst (index) {
        this.obj[index]["obst"] = true;
    }
    addPosXY (index, x, y) {
        this.obj[index]["posX"] = x;
        this.obj[index]["posY"] = y;
    }
    findIndexLastActiv () {
        for(let elem in this.obj) {
            if ( this.obj[elem]["lastActiv"] ) {
                return elem;
            }
        }
    }
    coordinatesElem (index) { 
        let x, y;
        x = this.obj[index]["posX"];
        y = this.obj[index]["posY"];
        return {x, y};
    }
    isActiv(index) {
        if ( this.obj[index]["activ"] ) {
            return true;
        } 
        return false;
    }
    isObstacle(index) {
        if ( this.obj[index]["obst"] ) {
            return true;
        } 
        return false;
    }
    isStutus(index) {
        if ( this.obj[index]["status"] ) {
            return this.obj[index]["status"];
        } 
        return false;
    }
    findIndexLastStatus (value) {
        for(let elem in this.obj) {
            if ( this.obj[elem]["status"] === value ) {
                return elem;
            }
        }
    }
    isAllActive () {
        let num = 0;
        for(let elem in this.obj) {
            if ( this.obj[elem]["obst"] || this.obj[elem]["activ"] ) {
                num++;
            }
        }
        return num;
    }

}

let arrElemSVG = new ElemSVGClass("level", "compLevel");

//-----------------------------------------------------------------------------------------
// если массив уровней пустой, то подгружаем
if(!arrLevels) {
    getLevels();
}

function progress(eo) {
    if ( eo.lengthComputable ) {
        const perc=Math.round(eo.loaded/eo.total*100);
        document.getElementById('IProgressPerc').style.width = perc+"%";
    }
}

function complete() {
    document.getElementById('IProgress').style.display="none";
    switchToStateFromURLHash();
}

function getLevels() {
    $.ajax(
        {   url : "https://fe.it-academy.by/AjaxStringStorage2.php", 
            type : 'POST', cache : false, dataType:'json',
            data : { f : 'READ', n : 'MARKOVICH_LINK_NUMBER_LEVELS' },
            success : readReady, complete:complete, error : errorHandler,
            xhrFields: { onprogress: progress }
        }
    );
}

function readReady(result) {
    if ( result.error != undefined )
        alert(result.error);
    else if ( result.result != "" ) {
        arrLevels = JSON.parse(result.result);
    }
}

function errorHandler(statusStr, errorStr) {
    alert(statusStr+' '+errorStr);
}

//-----------------------------------------------------------------------------------------
// SPA
window.onhashchange=switchToStateFromURLHash;

function switchToStateFromURLHash() {
    let URLHash=window.location.hash;

    let stateStr = URLHash.substr(1);
    
    if ( stateStr != "" ) { 
        SPAState = { pagename : stateStr }; 
    } else {
        SPAState = { pagename : "Main" }; 
    }

    let pageHTML="";

    let containerEverything = document.getElementById("containerEverything");

    switch ( SPAState.pagename ) {
        case "Main":
            pageHTML+="<div id='containerMain'>"
            pageHTML+="<h1>Link Number</h1>";
            pageHTML+="<input class='inputMain' type=text id='IName' ";
            pageHTML+="placeholder='Введите имя' autofocus maxlength='15'>";
            pageHTML+="<button class='btnMain' id='playBtn'>Играть</button>";
            pageHTML+="<button class='btnMain' id='optionsBtn'>Параметры</button>";
            pageHTML+="<button class='btnMain' id='aboutGameBtn'>Об игре</button>";
            pageHTML+="<button class='btnMain' id='leaderboardBtn'>Таблица лидеров</button>";
            pageHTML+="</div>";
            pageHTML+="<div id='modal'></div>";
            containerEverything.innerHTML=pageHTML;
            resetGamepage(); // обнуление обработчиков событий, кот. были установлены для игры
            processEventsMain(); // установка обработчиков событий 
            nameUserSet() // отображение имени пользователя на главной странице
            
            break;
        case "Play":
            pageHTML+="<div id='container'>";
            pageHTML+="<div id='btnContainer'></div>";
            pageHTML+="<div id='SVGContainer'></div>";  
            pageHTML+="<div id='btnContainerback'></div>";
            pageHTML+="</div>";
            pageHTML+="<div id='SVGContAnim'></div>";
            containerEverything.innerHTML=pageHTML;
            resetGameData(); // обнуление данных, кот. нужны для игры
            determineDimensionsElem(); // определение размеров элементов в зависимости от окна браузера
            bildBtn(); // построение кнопки перехода по уровням
            bildBtnBack(); // построение кнопки "назад"
            bildSVG(); // построение SVG
            processEvents(); // установка обработчиков событий 
            break;
        case "Options":
            pageHTML+="<div id='options'>";
            pageHTML+="<h2 class='param'><span>Музыка</span> <button class='checkbox' id='music'></button></h2>";
            pageHTML+="<h2 class='param'><span>Звук</span> <button class='checkbox' id='sound'></button></h2>";
            pageHTML+="<button class='mainMenuBtn'>Главное меню</button>";
            pageHTML+="</div>";
            containerEverything.innerHTML=pageHTML;
            resetGamepage(); // обнуление обработчиков событий, кот. были установлены для игры
            backgrounColordBtn(); // установка цвета кнопок управления музыкой и звуком
            processEventsOptions () // установка обработчиков событий 
            break;
        case "About":
            pageHTML+="<div id='aboutGame'>";
            pageHTML+="<h2>Об игре</h2>";
            pageHTML+="<p>Link Number - это очень простая и успокаивающая головоломка. ";
            pageHTML+="Все, что вам нужно для игры в Link Number - это мышь или один палец. ";
            pageHTML+="Link Number не сложна или запутана, поэтому любой, ";
            pageHTML+="независимо от возраста или пола, может наслаждаться ею.";
            pageHTML+="Успокойте свой разум и двигайтесь, как если бы вы решали простой лабиринт.</p>";
            pageHTML+="<h2>Как играть</h2>";
            pageHTML+="<p>Перетаскивайте круги, чтобы их соединить.";
            pageHTML+="Начинайте с 1 и заканчивайте на пронумерованной ячейке.";
            pageHTML+="Вы не можете соединяться через препятствия и повторяющиеся линии.</p>";
            pageHTML+="<button class='mainMenuBtn'>Главное меню</button>";
            pageHTML+="</div>";
            containerEverything.innerHTML=pageHTML;
            resetGamepage(); // обнуление обработчиков событий, кот. были установлены для игры
            processEventsAbout () // установка обработчиков событий 
            break;
    }
}

function switchToState(newState) {
    location.hash = newState.pagename;
}

function switchToMainPage() {
    switchToState( {pagename:"Main"} );
}
function switchToPlayPage() {
    switchToState( {pagename: "Play"} );
}
function switchToOptionsPage() {
    switchToState( {pagename:"Options"} );
}
function switchToAboutPage() {
    switchToState( {pagename:"About"} );
}
//-----------------------------------------------------------------------------------------
// функция установки обработчиков событий для кнопок на главной странице
function processEventsMain () {
    let playBtn = document.getElementById("playBtn");
    playBtn.addEventListener("click", switchToPlayPage);
    playBtn.addEventListener("click", soundPlayClick);
    let optionsBtn = document.getElementById("optionsBtn");
    optionsBtn.addEventListener("click", switchToOptionsPage);
    optionsBtn.addEventListener("click", soundPlayClick);
    let aboutGameBtn = document.getElementById("aboutGameBtn");
    aboutGameBtn.addEventListener("click", switchToAboutPage);
    aboutGameBtn.addEventListener("click", soundPlayClick);
    let leaderboardBtn = document.getElementById("leaderboardBtn");
    leaderboardBtn.addEventListener("click", leaderboardFunc);
    leaderboardBtn.addEventListener("click", soundPlayClick);
    let INameElem = document.getElementById("IName");
    INameElem.addEventListener("blur", nameUserFunc);
}
// функция установки обработчиков событий для кнопок на странице параметров
function processEventsOptions () {
    let mainMenuBtn = document.querySelector(".mainMenuBtn")
    mainMenuBtn.addEventListener("click", switchToMainPage);
    mainMenuBtn.addEventListener("click", soundPlayClick);
    let musicBtn = document.getElementById("music");
    musicBtn.addEventListener( "click", () => {musicPlayPause(musicBtn);} );
    let soundBtn = document.getElementById("sound");
    soundBtn.addEventListener( "click", () => {soundPlayPause(soundBtn);} );
}
// функция установки обработчиков событий для кнопки на странице "об игре"
function processEventsAbout () {
    let mainMenuBtn2 = document.querySelector(".mainMenuBtn")
    mainMenuBtn2.addEventListener("click", switchToMainPage);
    mainMenuBtn2.addEventListener("click", soundPlayClick);
}
// функция запоминания имени пользователя
function nameUserFunc() {
    nameUser = document.getElementById('IName').value;
}
// функция отображения имени пользователя на главной странице
function nameUserSet () {
    if (nameUser) {
        document.getElementById('IName').value = nameUser;
    }
}
// функция включения / выключения музыки при клике на кнопку
function musicPlayPause(musicBtn) {
    if(!musicPlay) {
        musicCont.play();
        musicBtn.style.backgroundColor = color.beige;
        musicPlay = true;
    } else {
        musicCont.pause();
        musicBtn.style.backgroundColor = color.spicedApple;
        musicPlay = false;
    } 
}
// функция включения / выключения звука при клике на кнопку
function soundPlayPause(soundBtn) {
    if(!soundPlay) {
        soundCont.play();
        soundBtn.style.backgroundColor = color.beige;
        soundPlay = true;
    } else {
        soundCont.pause();
        soundBtn.style.backgroundColor = color.spicedApple;
        soundPlay = false;
    } 
}
// функция установки цвета кнопкам управления музыкой и звуком
function backgrounColordBtn () {
    let musicBtn = document.getElementById("music");
    let soundBtn = document.getElementById("sound");
    if(!musicPlay) {
        musicBtn.style.backgroundColor = color.spicedApple;
    } else {
        musicBtn.style.backgroundColor = color.beige;
    } 
    if(!soundPlay) {
        soundBtn.style.backgroundColor = color.spicedApple;
    } else {
        soundBtn.style.backgroundColor = color.beige;
    } 
}
// функция обнуления данных, кот. нужны для игры
function resetGameData() {
    polylineСoordinates = [{}]; // хранилище координат полилиннии
    arrCircle = []; // хранение элементов сircle
    arrElemSVG.clearObj();
    arrElemSVG.resetCellNumber();
}
// функция обнуления обработчиков событий, кот. были установлены для игры
function resetGamepage() {
    window.removeEventListener("mouseup", mouseupFunc);  
    window.removeEventListener("touchend", touchendFunc);
    window.removeEventListener("resize", updateElem);
}
//-----------------------------------------------------------------------------------------
// функция включения звука при клике по кнопкам
function soundPlayClick() {
    if(soundPlay) {
        soundCont.play();
    } 
}
//-----------------------------------------------------------------------------------------
// функция формирования таблицы рекордов
function leaderboardFunc() {  
    function restoreInfo() {
        $.ajax(
            {
                url : ajaxHandlerScript, type : 'POST', cache : false, dataType:'json',
                data : { f : 'READ', n : stringName },
                success : readReady, error : errorHandler
            }
        );
    }
    function readReady(callresult) {
        if ( callresult.error!=undefined )
            alert(callresult.error);
        else if ( callresult.result!="" ) {
            let pageHTML="", strHTMLName="", strHTMLLevel="";
            let infoArr=JSON.parse(callresult.result);
    
            for(let i=0; i<infoArr.length; i++) {
                strHTMLName+=`<p>${infoArr[i].playerName}<p>`;
                strHTMLLevel+=`<p>${infoArr[i].playerLevel}<p>`;
            }
    
            let modal = document.getElementById("modal");
            pageHTML+="<div class='leaderboard'>";
            pageHTML+=`<div class='leaderboardColl'><h3>Имя</h3>${strHTMLName}</div>`;
            pageHTML+=`<div class='leaderboardColl'><h3>Уровень</h3>${strHTMLLevel}</div>`;
            pageHTML+="<input type=button value='закрыть' id='closeModalId'>"
            pageHTML+="</div>";
            modal.innerHTML=pageHTML;
    
            modal.style.display='block';
    
            let closeModalId = document.getElementById("closeModalId");
            closeModalId.addEventListener("click", closeModal);
            closeModalId.addEventListener("click", soundPlayClick);
        
            function closeModal() {
                document.getElementById('modal').style.display='none';
            }
        }
    } 
    restoreInfo();
}
//-----------------------------------------------------------------------------------------
// сохранение данных пользователя 
// для формирования в дальнейшем таблицы рекордов 
// таблица рекордов показывает только 5 лучших рузультатов
function storeInfo() {
    updatePassword=Math.random();
    $.ajax( {
            url : ajaxHandlerScript, type : 'POST', cache : false, dataType:'json',
            data : { f : 'LOCKGET', n : stringName, p : updatePassword },
            success : lockGetReady, error : errorHandler
        }
    );
}

function lockGetReady(callresult) {
    if ( callresult.error!=undefined )
        alert(callresult.error);
    else {
        let info = JSON.parse(callresult.result);

        info.push(  { playerName : nameUser,
                      playerLevel : arrElemSVG.compLevel }  );

        function compareLevel (a, b) {
            if ( a.playerLevel<b.playerLevel ) return 1;
            if ( a.playerLevel>b.playerLevel ) return -1;
            return 0;
        }
        let newInfo = info.sort(compareLevel).slice(0,5);

        $.ajax( {
                url : ajaxHandlerScript, type : 'POST', cache : false, dataType:'json',
                data : { f : 'UPDATE', n : stringName,
                    v : JSON.stringify(newInfo), p : updatePassword },
                success : updateReady, error : errorHandler
            }
        );
    }
}

function updateReady(callresult) {
    if ( callresult.error!=undefined )
        alert(callresult.error);
}
//-----------------------------------------------------------------------------------------
// функция определения размеров элементов в зависимости от окна браузера
function determineDimensionsElem() {
    let heightWind = document.documentElement.clientHeight;
    let widthWind = document.documentElement.clientWidth;
    let fieldWidth, btnHeight, margin;

    if(heightWind*0.72<widthWind) {
        fieldWidth = heightWind*0.7;
        btnHeight = heightWind*0.06;

        btn.marginTop = btnHeight/3;
        btn.marginBott = btnHeight;
        btnBack.marginTop = btnHeight;
        btnBack.marginBott = btnHeight/3;
    } else {
        fieldWidth = widthWind*0.9;
        btnHeight = widthWind*0.09;

        field.width = fieldWidth;
        if (heightWind>(fieldWidth+btnHeight*2)) {
            margin = (heightWind-fieldWidth-btnHeight*2)/4.2;
        } else {
            margin = 0;
        }
        btn.marginTop = margin;
        btn.marginBott = margin;
        btnBack.marginTop = margin;
        btnBack.marginBott = margin;
    }

    field.width = fieldWidth;
    btn.width = fieldWidth/3;
    btn.height = btnHeight;
    btnBack.width = fieldWidth/5;
    btnBack.height = btnHeight;
    cell.radius = fieldWidth/Math.sqrt(arrLevels[arrElemSVG.level].numberСells)/2*0.8;
    cell.innerRadius = fieldWidth/Math.sqrt(arrLevels[arrElemSVG.level].numberСells)/2*0.65;
}
// функция построения кнопки перехода по уровням
function bildBtn() {
    let btnContainer = document.getElementById("btnContainer");
    let btnElem = document.createElement("button");
    btnElem.style.backgroundColor = color.beige;
    btnElem.style.width = `${btn.width}px`;
    btnElem.style.height = `${btn.height}px`;
    btnElem.style.border = "none";
    btnElem.style.fontSize = `${btn.height*0.8}px`;
    btnElem.style.color = color.spicedApple;
    btnElem.style.borderRadius = `${btn.height/2}px`;
    btnElem.style.marginTop = `${btn.marginTop}px`;
    btnElem.style.marginBottom = `${btn.marginBott}px`;
    btnElem.classList.add("btn");
    btnContainer.appendChild(btnElem);

    let w=btn.width;
    let h=btn.height;
    arrowLeftElem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrowLeftElem.setAttribute("width", w);
    arrowLeftElem.setAttribute("height", h);
    arrowLeftElem.setAttribute("viewBox",`0 0 ${w} ${h}`);
    arrowLeftElem.classList.add("arrow");
    btnElem.appendChild(arrowLeftElem);

    let polygonLeftElem = document.createElementNS("http://www.w3.org/2000/svg",'polyline');
    polygonLeftElem.setAttribute("fill", color.spicedApple);
    polygonLeftElem.setAttribute("points", `${w/5},${h/2} ${w*4/5},${h/20} ${w*4/5},${h*19/20}`);
    arrowLeftElem.appendChild(polygonLeftElem);

    let btnLevel = document.createElement("span");
    btnLevel.classList.add("btnLevel");
    btnElem.appendChild(btnLevel);
    btnLevel.textContent = `${arrElemSVG.level}`;

    arrowRightElem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrowRightElem.setAttribute("width", w);
    arrowRightElem.setAttribute("height", h);
    arrowRightElem.setAttribute("viewBox",`0 0 ${w} ${h}`);
    arrowRightElem.classList.add("arrow");
    btnElem.appendChild(arrowRightElem);

    let polygonRightElem = document.createElementNS("http://www.w3.org/2000/svg",'polyline');
    polygonRightElem.setAttribute("fill", color.spicedApple);
    polygonRightElem.setAttribute("points", `${w*4/5},${h/2} ${w/5},${h*19/20} ${w/5},${h/20}`);
    arrowRightElem.appendChild(polygonRightElem);

    if ( arrElemSVG.compLevel < arrElemSVG.level ) {
        arrowRightElem.setAttribute("style", "opacity: 0; cursor: default;");
    }
}
// функция построения SVG 
function bildSVG() {
    let cellElemN, numeralElem, textElemC, cellElemO, line1Elem, line2Elem, 
    rectElem, innerRectElem, textElemR, cellElem;
    let level = arrLevels[arrElemSVG.level];
    let sqrtNumberСells = Math.sqrt(level.numberСells);

    field.widthAnim = field.width;

    SVGElem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    SVGElem.setAttribute("width", field.width);
    SVGElem.setAttribute("height", field.width);
    SVGElem.setAttribute("viewBox",`0 0 ${field.width} ${field.width}`);
    SVGElem.setAttribute("style", "cursor:pointer");
    let SVGContainer = document.getElementById("SVGContainer");
    SVGContainer.appendChild(SVGElem);

    SVGElem.addEventListener("mousedown", prevDef);
    SVGElem.addEventListener("touchstart", prevDef);
    SVGElem.addEventListener("touchmove", prevDef);
    function prevDef(eo) {
        eo.preventDefault();
    }

    // построение полилинии
    polylineElem = document.createElementNS("http://www.w3.org/2000/svg",'polyline');
    polylineElem.setAttribute("stroke-linejoin", "round");
    polylineElem.setAttribute("stroke", color.peach);
    polylineElem.setAttribute("fill", "none");
    polylineElem.setAttribute("stroke-width", cell.strokeWidth);
    SVGElem.appendChild( polylineElem);

    for(let i=0; i<sqrtNumberСells; i++) {
        for(let j=0; j<sqrtNumberСells; j++) {

            let iscell = false, obstacle = false;
            let cellSize = field.width/sqrtNumberСells;
            let x = cellSize*j+cellSize/2;
            let y = cellSize*i+cellSize/2;
            let index = sqrtNumberСells*i+j;
            arrElemSVG.addObj(index);

            for(let k=1; k<level.numberDigits; k++) {
                if(i === level[`${k}`].posX && j === level[`${k}`].posY) {
                    let groupElem = document.createElementNS("http://www.w3.org/2000/svg",'g');
                    if(k === 1) {
                        arrElemSVG.changeLastActiv(index, true);
                        arrElemSVG.changeActiv(index, true);
                        // добавление первых координат полилинии
                        polylineСoordinates[0][index] = [x, y];
                    }
                    arrElemSVG.addStatus(index, k);
                    groupElem.classList.add("cellElem");
                    SVGElem.appendChild(groupElem);

                    arrElemSVG.addPosXY(index, x, y);

                    cellElemN = document.createElementNS("http://www.w3.org/2000/svg",'circle');
                    cellElemN.setAttribute("r", cell.radius);
                    cellElemN.setAttribute("cx", x);
                    cellElemN.setAttribute("cy", y);
                    if (k === 1) {
                        cellElemN.setAttribute("stroke", color.peach);
                    } else {
                        cellElemN.setAttribute("stroke", color.beige);
                    }
                    cellElemN.setAttribute("stroke-width", cell.strokeWidth);
                    cellElemN.setAttribute("fill-opacity","0");
                    groupElem.appendChild(cellElemN);

                    numeralElem = document.createElementNS("http://www.w3.org/2000/svg",'circle');
                    numeralElem.setAttribute("r", cell.innerRadius);
                    numeralElem.setAttribute("cx", x);
                    numeralElem.setAttribute("cy", y);
                    if(k === 1) {
                        numeralElem.setAttribute("fill", color.peach);
                    } else {
                        numeralElem.setAttribute("fill", color.beige);
                    }
                    groupElem.appendChild(numeralElem);
                    
                    textElemC = document.createElementNS("http://www.w3.org/2000/svg",'text');
                    textElemC.setAttribute("font-family","sans-serif");
                    textElemC.setAttribute("font-size", cell.innerRadius*2);
                    textElemC.setAttribute("fill",color.spicedApple);
                    textElemC.setAttribute("text-anchor","middle");
                    textElemC.setAttribute("x", x);
                    textElemC.setAttribute("y", y+cell.innerRadius*0.7);
                    textElemC.textContent=`${k}`;
                    groupElem.appendChild(textElemC);
                    iscell = true;
                    break;
                }
            }

            if (level.isObstacle) {
                for(let k=0; k<level.isObstacle.length; k++) {
                    if(i === level.isObstacle[k].posX && j === level.isObstacle[k].posY) {
                        let groupElem = document.createElementNS("http://www.w3.org/2000/svg",'g');
                        groupElem.classList.add("cellElem");
                        arrElemSVG.addObst(index);
                        SVGElem.appendChild(groupElem);

                        arrElemSVG.addPosXY(index, x, y);
                        arrCircle[index] = groupElem;

                        cellElemO = document.createElementNS("http://www.w3.org/2000/svg",'circle');
                        cellElemO.setAttribute("r", cell.radius);
                        cellElemO.setAttribute("cx", x);
                        cellElemO.setAttribute("cy", y);
                        cellElemO.setAttribute("stroke", color.beige);
                        cellElemO.setAttribute("stroke-width", cell.strokeWidth);
                        cellElemO.setAttribute("fill", color.beige);
                        groupElem.appendChild(cellElemO);

                        line1Elem = document.createElementNS("http://www.w3.org/2000/svg",'line');
                        line1Elem.setAttribute("x1", x-cell.radius/2);
                        line1Elem.setAttribute("y1", y-cell.radius/2);
                        line1Elem.setAttribute("x2", x+cell.radius/2);
                        line1Elem.setAttribute("y2", y+cell.radius/2);
                        line1Elem.setAttribute("stroke",color.spicedApple);
                        line1Elem.setAttribute("stroke-width", cell.strokeWidth);
                        line1Elem.setAttribute("stroke-linecap","round");
                        groupElem.appendChild(line1Elem);

                        line2Elem = document.createElementNS("http://www.w3.org/2000/svg",'line');
                        line2Elem.setAttribute("x1", x-cell.radius/2);
                        line2Elem.setAttribute("y1", y+cell.radius/2);
                        line2Elem.setAttribute("x2", x+cell.radius/2);
                        line2Elem.setAttribute("y2", y-cell.radius/2);
                        line2Elem.setAttribute("stroke",color.spicedApple);
                        line2Elem.setAttribute("stroke-width", cell.strokeWidth);
                        line2Elem.setAttribute("stroke-linecap","round");
                        groupElem.appendChild(line2Elem);
                        obstacle = true;
                        break;
                    }
                }
            }
            if(i === level[`${level.numberDigits}`].posX && 
            j === level[`${level.numberDigits}`].posY
            ) {
                arrElemSVG.addPosXY(index, x, y);
                let groupElem = document.createElementNS("http://www.w3.org/2000/svg",'g');
                groupElem.classList.add("cellElem");
                arrElemSVG.addStatus(index, level.numberDigits);
                SVGElem.appendChild(groupElem);

                rectElem = document.createElementNS("http://www.w3.org/2000/svg",'rect');
                rectElem.setAttribute("x", x-cell.radius);
                rectElem.setAttribute("y", y-cell.radius);
                rectElem.setAttribute("width", cell.radius*2);
                rectElem.setAttribute("height", cell.radius*2);
                rectElem.setAttribute("fill-opacity","0");
                rectElem.setAttribute("stroke", color.beige);
                rectElem.setAttribute("stroke-width", cell.strokeWidth);
                groupElem.appendChild(rectElem);

                innerRectElem = document.createElementNS("http://www.w3.org/2000/svg",'rect');
                innerRectElem.setAttribute("x", x-cell.innerRadius);
                innerRectElem.setAttribute("y", y-cell.innerRadius);
                innerRectElem.setAttribute("width", cell.innerRadius*2);
                innerRectElem.setAttribute("height", cell.innerRadius*2);
                innerRectElem.setAttribute("fill", color.beige);
                groupElem.appendChild(innerRectElem);

                textElemR = document.createElementNS("http://www.w3.org/2000/svg",'text');
                textElemR.setAttribute("font-family","sans-serif");
                textElemR.setAttribute("font-size", cell.innerRadius*2);
                textElemR.setAttribute("fill",color.spicedApple);
                textElemR.setAttribute("text-anchor","middle");
                textElemR.setAttribute("x", x);
                textElemR.setAttribute("y", y+cell.innerRadius*0.7);
                textElemR.textContent=`${level.numberDigits}`;
                groupElem.appendChild(textElemR);
            } else if(!iscell && !obstacle) {
                cellElem = document.createElementNS("http://www.w3.org/2000/svg",'circle');
                cellElem.setAttribute("r", cell.radius);
                cellElem.setAttribute("cx", x);
                cellElem.setAttribute("cy", y);
                cellElem.setAttribute("stroke", color.beige);
                cellElem.setAttribute("stroke-width", cell.strokeWidth);
                cellElem.setAttribute("fill-opacity","0");
                cellElem.classList.add("cellElem");
                SVGElem.appendChild(cellElem);
                arrCircle[index] = cellElem;
                arrElemSVG.addPosXY(index, x, y);
                cell.rAnim = cell.radius;
            }
        }
    }
}
// функция построения кнопки назад
function bildBtnBack() {
    let btnContainerback = document.getElementById("btnContainerback");
    let btnElem = document.createElement("button");
    btnElem.style.backgroundColor = color.beige;
    btnElem.style.width = `${btnBack.width}px`;
    btnElem.style.height = `${btnBack.height}px`;
    btnElem.style.border = "none";
    btnElem.style.fontSize = `${btnBack.height}px`;
    btnElem.style.color = color.spicedApple;
    btnElem.style.borderRadius = `${btnBack.height/2}px`;
    btnElem.style.marginTop = `${btnBack.marginTop}px`;
    btnElem.style.marginBottom = `${btnBack.marginBott}px`;
    btnElem.classList.add("btnBack");
    btnContainerback.appendChild(btnElem);

    let w=btnBack.width*0.5;
    let h=btnBack.height*0.5;
    let SvgArrowElem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    SvgArrowElem.setAttribute("width", w);
    SvgArrowElem.setAttribute("height", h);
    SvgArrowElem.setAttribute("viewBox",`0 0 ${w} ${h}`);
    btnElem.appendChild(SvgArrowElem);

    let polygonElem = document.createElementNS("http://www.w3.org/2000/svg",'polyline');
    polygonElem.setAttribute("stroke-linejoin", "round");
    polygonElem.setAttribute("fill", color.spicedApple);
    polygonElem.setAttribute("stroke-width", cell.strokeWidth);
    polygonElem.setAttribute("points", 
        `0,${h/2} ${w*2/3},0 ${w/2},${h/4} ${w},${h/4} ${w},${h*3/4} ${w/2},${h*3/4} ${w*2/3},${h}`);
    SvgArrowElem.appendChild(polygonElem);
}
//-----------------------------------------------------------------------------------------
// функция изменения размера SVG при изменении экрана
function updateSVG() {
    SVGElem.setAttribute("width", field.width);
    SVGElem.setAttribute("height", field.width);
}
// функция изменения размера кнопки перехода по уровням при изменении экрана
function updateBtn() {
    let btnElem = document.querySelector(".btn");
    btnElem.style.width = `${btn.width}px`;
    btnElem.style.height = `${btn.height}px`;
    btnElem.style.fontSize = `${btn.height*0.8}px`;
    btnElem.style.borderRadius = `${btn.height/2}px`;
    btnElem.style.marginTop = `${btn.marginTop}px`;
    btnElem.style.marginBottom = `${btn.marginBott}px`;
    
    let svgArrowElem = btnElem.getElementsByTagName("svg");
    svgArrowElem[0].setAttribute("width", btn.width);
    svgArrowElem[0].setAttribute("height", btn.height);
    svgArrowElem[1].setAttribute("width", btn.width);
    svgArrowElem[1].setAttribute("height", btn.height);
}
// функция изменения размера кнопки "назад" при изменении экрана
function updateBtnBack() {
    let btnElem = document.querySelector(".btnBack");
    btnElem.style.width = `${btnBack.width}px`;
    btnElem.style.height = `${btnBack.height}px`;
    btnElem.style.fontSize = `${btnBack.height*1.2}px`;
    btnElem.style.borderRadius = `${btnBack.height/2}px`;
    btnElem.style.marginTop = `${btnBack.marginTop}px`;
    btnElem.style.marginBottom = `${btnBack.marginBott}px`;

    let SvgArrowElem = btnElem.getElementsByTagName("svg");
    SvgArrowElem[0].setAttribute("width", btnBack.width*0.5);
    SvgArrowElem[0].setAttribute("height", btnBack.height*0.5);
}
//-----------------------------------------------------------------------------------------
// функция обновления элементов на странице "игра" при изменении ширины окна 
function updateElem() {
    determineDimensionsElem();
    updateBtn();
    updateSVG();
    updateBtnBack();
}
//-----------------------------------------------------------------------------------------
// функции установки обработчиков событий на странице игры
function processEvents() {
    circleElem = SVGElem.getElementsByClassName("cellElem");
    for(let elem of circleElem) {
        elem.addEventListener("click", playGame);
        elem.addEventListener("mousedown", mousedownFunc);
        elem.addEventListener("touchstart", touchstartFunc);
    }
    window.addEventListener("mouseup", mouseupFunc);  
    window.addEventListener("touchend", touchendFunc);
    window.addEventListener("resize", updateElem);

    let mainBtn = document.querySelector(".btnBack")
    mainBtn.addEventListener("click", switchToMainPage);
    mainBtn.addEventListener("click", saveResult);
    mainBtn.addEventListener("click", soundPlayClick);

    arrowLeftElem.addEventListener('click', changeLevelLArrow);
    arrowLeftElem.addEventListener('click', soundPlayClick);

    if ( arrElemSVG.compLevel >= arrElemSVG.level ) {
        arrowRightElem.addEventListener('click', changeLevelRArrow);
        arrowRightElem.addEventListener('click', soundPlayClick);
    } 
    
}
function touchstartFunc(eo) {
    playGame(eo);
    SVGElem.addEventListener("touchmove", playGame);
}
function touchendFunc() { 
    SVGElem.removeEventListener("touchmove", playGame);
}
function mousedownFunc(eo) {
    playGame(eo);
    for(let elem of circleElem) {
        elem.addEventListener("mousemove", playGame);
    }
}
function mouseupFunc() {
    for(let elem of circleElem) {
        elem.removeEventListener("mousemove", playGame);
    }
}
//-----------------------------------------------------------------------------------------
// функция перехода по уровням при клике на стрелку "влево"
function changeLevelLArrow () {
    arrElemSVG.decreaseLevel();
    arrElemSVG.addLS();
    arrElemSVG.resetCellNumber();
    switchToStateFromURLHash();
}
// функция перехода по уровням при клике на стрелку "вправо"
function changeLevelRArrow () {
    arrElemSVG.increaseLevel();
    arrElemSVG.addLS();
    arrElemSVG.resetCellNumber();
    switchToStateFromURLHash();
}
//-----------------------------------------------------------------------------------------
// функция сохранения результатов игры при клике на кнопку "назад" на странице "игра"
function saveResult () {
    if(nameUser && arrElemSVG.compLevel>0) {
        storeInfo();
    } 
}
//-----------------------------------------------------------------------------------------
// игра
function playGame(eo) {
    let x1, y1, x2, y2, indexLastActive, indexElem=0, step;
    let elem = eo.currentTarget;
    // определение elem на сенсорных экранах 
    if(eo.touches) {
        let firstTouch = eo.touches[0];
        let xTouch = firstTouch.clientX;
        let yTouch = firstTouch.clientY;
        let numLinesColumn = Math.sqrt(arrLevels[arrElemSVG.level].numberСells);
        let marginX = SVGElem.getBoundingClientRect().x;
        let marginY = SVGElem.getBoundingClientRect().y;
        
        for(let i=0; i<numLinesColumn; i++) {
            for(let j=0; j<numLinesColumn; j++) {
                let x1 = marginX + field.width/numLinesColumn*i;
                let x2 = marginX + field.width/numLinesColumn*(i+1);
                let y1 = marginY + field.width/numLinesColumn*j;
                let y2 = marginY + field.width/numLinesColumn*(j+1);
                
                if(xTouch >= x1 && xTouch <= x2 &&
                   yTouch >= y1 && yTouch <= y2) {
                    let indElem = numLinesColumn*j+i;
                    elem = circleElem[indElem];
                }
            }
        }
    }
    // определение индекса последнего активного элемента в HTMLCollection
    indexLastActive = arrElemSVG.findIndexLastActiv();
    // определение координат последнего активного элемента
    x1 = arrElemSVG.coordinatesElem(indexLastActive).x;
    y1 = arrElemSVG.coordinatesElem(indexLastActive).y;
    // определение индекса кликнутого элемента в HTMLCollection
    for(let n of circleElem) {
        if(n === elem) {
            break;
        }
        indexElem++;
    }
    // определение координат кликнутого элемента
    if(indexElem < circleElem.length) {
        x2 = arrElemSVG.coordinatesElem(indexElem).x;
        y2 = arrElemSVG.coordinatesElem(indexElem).y;
    }
    // если кликнутый элемент активный(имеет линию), то удаляем полилинию
    if( indexElem < circleElem.length && arrElemSVG.isActiv(indexElem) ) {   
        deleteLine(indexLastActive, indexElem);
    }
    // если кликнутый элемент неактивный(не имеет линии), то строим полилинию
    step = field.widthAnim/Math.sqrt(circleElem.length);

    if( indexElem < circleElem.length &&
        !arrElemSVG.isObstacle(indexElem) &&
        !arrElemSVG.isActiv(indexElem) &&
        ( x1 === x2 && ( Math.floor(y1+step) === Math.floor(y2) || 
                         Math.floor(y1-step) === Math.floor(y2) ) ||

          y1 === y2 && ( Math.floor(x1+step) === Math.floor(x2) || 
                         Math.floor(x1-step) === Math.floor(x2) ) )
    ) { 
        if( (arrElemSVG.isStutus(indexElem) &&  
             arrElemSVG.isStutus(indexElem) === arrElemSVG.cellNumber+1 ) 
        ) {
            soundPlayClick();
            bildLine(indexLastActive, x2, y2, indexElem);
            animColor(elem, indexElem);
            animCircle(x2, y2);
            arrElemSVG.addCellNumber();
        } else if(!arrElemSVG.isStutus(indexElem)) {
            soundPlayClick();
            bildLine(indexLastActive, x2, y2, indexElem);
            animColor(elem, indexElem);
            animCircle(x2, y2);
        }
    }

    // условия окончания игры
    if ( arrElemSVG.isAllActive() === circleElem.length && 
         indexElem == arrElemSVG.findIndexLastStatus(arrLevels[arrElemSVG.level].numberDigits)
         ) {
            
            for(let elem of circleElem) {
                elem.removeEventListener("click", playGame);
                elem.removeEventListener("mousedown", mousedownFunc);
                elem.removeEventListener("touchstart", touchstartFunc);
                elem.removeEventListener("mousemove", playGame);
            }
            SVGElem.removeEventListener("touchmove", playGame);

            arrElemSVG.addCompLevel();
            arrElemSVG.loadCompLevel();
            arrElemSVG.increaseLevel();
            arrElemSVG.addLS();
            arrElemSVG.resetCellNumber();
            animEnd();   
    }
}

// функция анимации окончания игры
function animEnd() {
    let heightWind = document.documentElement.clientHeight;
    let widthWind = document.documentElement.clientWidth;
    let opacityCell=1, r=field.width*0.2, strWidth=field.width*0.2, opacityBtn=0.01;
 
    arrCircle.forEach( (v) => v.remove() );
    SVGElem.setAttribute("style", "cursor:default");

    let container =document.getElementById("SVGContAnim");
    let SVGCircle = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    SVGCircle.setAttribute("width", widthWind);
    SVGCircle.setAttribute("height", heightWind);
    SVGCircle.setAttribute("viewBox",`0 0 ${heightWind} ${widthWind}`);
    container.appendChild(SVGCircle);

    let cellElem = document.createElementNS("http://www.w3.org/2000/svg",'circle');
    cellElem.setAttribute("r", r);
    cellElem.setAttribute("cx", heightWind/2);
    cellElem.setAttribute("cy", widthWind/2);
    cellElem.setAttribute("stroke", color.peach);
    cellElem.setAttribute("stroke-width", strWidth);
    cellElem.setAttribute("fill", "none");
    SVGCircle.appendChild(cellElem);

    let btnElem = btnContinue();
    btnElem.addEventListener('click', switchToStateFromURLHash);
    btnElem.addEventListener('touchstart', switchToStateFromURLHash);

    function animSize () {
        cellElem.setAttribute("stroke-width", strWidth);
        cellElem.setAttribute("r", r);
        cellElem.setAttribute("stroke-opacity", opacityCell);
        r+=8;
        strWidth+=4;
        opacityCell-=0.01;

        btnElem.style.opacity = `${opacityBtn}`;
        opacityBtn+=0.01;

        if(opacityCell < 0 && opacityBtn > 1) {
            clearInterval(intervalAnimSize);
            SVGCircle.remove();
        }
    }
    let intervalAnimSize = setInterval(animSize, 7);
}
// функция построения кнопки "Продолжить"
function btnContinue () {
    let gElem = document.createElementNS("http://www.w3.org/2000/svg",'g');
    SVGElem.appendChild(gElem);

    let rectElem = document.createElementNS("http://www.w3.org/2000/svg",'rect');
    rectElem.setAttribute("x", (field.widthAnim-field.widthAnim/2)/2);
    rectElem.setAttribute("y", (field.widthAnim-field.widthAnim/8)/2);
    rectElem.setAttribute("rx", field.widthAnim/16);
    rectElem.setAttribute("ry", field.widthAnim/16);
    rectElem.setAttribute("width", field.widthAnim/2);
    rectElem.setAttribute("height", field.widthAnim/8);
    rectElem.setAttribute("fill", color.beige);
    rectElem.setAttribute("style", "cursor:pointer");
    gElem.appendChild(rectElem);

    let textElem = document.createElementNS("http://www.w3.org/2000/svg",'text');
    textElem.setAttribute("font-family","sans-serif");
    textElem.setAttribute("font-size", field.widthAnim/15);
    textElem.setAttribute("fill", color.spicedApple);
    textElem.setAttribute("text-anchor","middle");
    textElem.setAttribute("x", field.widthAnim/2);
    textElem.setAttribute("y", (field.widthAnim-field.widthAnim/6)/2*1.25);
    textElem.textContent="Продолжить";
    textElem.setAttribute("style", "cursor:pointer");
    gElem.appendChild(textElem);

    return gElem;
}
// функция вытягивание координат из хранилища координат для полилинии
function strСoordinates() {
    let str = "";
    for(let num=0; num<polylineСoordinates.length; num++) {
        let key = Object.keys(polylineСoordinates[num]);
        str = str + polylineСoordinates[num][key[0]][0] + "," + 
              polylineСoordinates[num][key[0]][1] + " ";
    }
    return str;
}
// функция построения полилинии
function bildLine(indexLastActive, x, y, indexElem) {
    // добавление координат кликнутого элемента для полилинии
    let obj = {};
    obj[indexElem] = [Number(x), Number(y)];
    polylineСoordinates.push( obj );
    polylineElem.setAttribute("points", strСoordinates());

    arrElemSVG.changeActiv(indexElem, true);
    arrElemSVG.changeLastActiv(indexElem, true);
    arrElemSVG.changeLastActiv(indexLastActive, false);
}
// функция удаления полилинии
function deleteLine(indexLastActive, indexElem) {
    // поиск индекса массива, который хранит последовательность координат полилинии
    let indexClickActive;
    for(let m=0; m<polylineСoordinates.length; m++) {
        if(indexElem in polylineСoordinates[m]) {
            indexClickActive = m;
        }
    }
    // удаление active, изменение cellNumber и установка цвета по умолчанию
    for(let i=polylineСoordinates.length-1; i>indexClickActive; i--) {
        let key = Object.keys(polylineСoordinates[i]);
        arrElemSVG.changeActiv(key[0], false);
        if( arrElemSVG.isStutus(key[0]) ) {
            arrElemSVG.removeCellNumber();
        } 
        colorDef(circleElem[key[0]], key[0]);
    }
    // удаление лишних координат
    polylineСoordinates.splice(indexClickActive+1, polylineСoordinates.length-1);
    polylineElem.setAttribute("points", strСoordinates());
    // изменение lastActiv
    arrElemSVG.changeLastActiv(indexLastActive, false);
    arrElemSVG.changeLastActiv(indexElem, true);
}   
// функция анимации кликнутых элементов
function animCircle(x, y) {
    let r = cell.rAnim, opacityCell = 1;
    
    let cellElem = document.createElementNS("http://www.w3.org/2000/svg",'circle');
    cellElem.setAttribute("r", r);
    cellElem.setAttribute("cx", x);
    cellElem.setAttribute("cy", y);
    cellElem.setAttribute("stroke", color.peach);
    cellElem.setAttribute("stroke-width", cell.strokeWidth/1.5);
    cellElem.setAttribute("fill-opacity","0");
    SVGElem.appendChild(cellElem);

    function animSize () {
        cellElem.setAttribute("r", r);
        cellElem.setAttribute("stroke-opacity", opacityCell);
        r++;
        opacityCell-=0.02;

        if (opacityCell < 0) {
            clearInterval(intervalAnimSize);
            cellElem.remove();
        }
    }
    let intervalAnimSize = setInterval(animSize, 7);
}
// функция изменения цвета активного элемента 
function animColor(elem, indexElem) {
        
    if( arrElemSVG.isStutus(indexElem) ) {
        let circles = elem.getElementsByTagName("circle");
        let rectes = elem.getElementsByTagName("rect");
        if(circles.length !== 0) {
            circles[0].style.transitionDuration='1s';
            circles[1].style.transitionDuration='1s';
            circles[0].setAttribute("stroke",color.peach);
            circles[1].setAttribute("fill",color.peach);
        } else if(rectes.length !== 0) {
            rectes[0].style.transitionDuration='1s';
            rectes[1].style.transitionDuration='1s';
            rectes[0].setAttribute("stroke",color.peach);
            rectes[1].setAttribute("fill",color.peach);
        }
    } else {
        elem.style.transitionDuration='1s';
        elem.setAttribute("stroke",color.peach);
        elem.setAttribute("fill",color.peach);
    }
}
// функция изменения цвета элемента на цвет по умольчанию
function colorDef(activElem, index) {
    if( arrElemSVG.isStutus(index) ) {
        let circles = activElem.getElementsByTagName("circle");
        let rectes = activElem.getElementsByTagName("rect");
        if(circles.length !== 0) {
            circles[0].style.transitionDuration='1s';
            circles[1].style.transitionDuration='1s';
            circles[0].setAttribute("stroke",color.beige);
            circles[1].setAttribute("fill",color.beige);
        } else if(rectes.length !== 0) {
            rectes[0].style.transitionDuration='1s';
            rectes[1].style.transitionDuration='1s';
            rectes[0].setAttribute("stroke",color.beige);
            rectes[1].setAttribute("fill",color.beige);
        }
    } else {
        activElem.style.transitionDuration='1s';
        activElem.setAttribute("stroke",color.beige);
        activElem.setAttribute("fill",color.beige);
    }
}