"use strict"
///contains:
/// class Messages (squre with controls behind) 
/// class FbMessages (one line of text in front)
var currentFbMessage = null;

class Messages {

    plane = BABYLON.Mesh.CreatePlane("plane", 10);
    advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.plane);
    currentScreen = "init";
    nextButton;///also sent as parameter in new session and called from there
    constructor() {
        this.plane.position.z = -25;
        this.plane.position.y = 2;/////2
        this.plane.position.x = 0;
        this.plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;///without iא its mirror

        this.textField = new BABYLON.GUI.TextBlock("upperText");

        this.advancedTexture.background = 'green'


        this.nextButton = BABYLON.GUI.Button.CreateSimpleButton("but1", "המשך");
        this.nextButton.width = 1;
        this.nextButton.height = 0.4;
        this.nextButton.color = "white";
        this.nextButton.fontSize = 50;
        this.nextButton.background = "green";
        this.nextButton.onPointerUpObservable.add(this.screenDone.bind(this));
        this.nextButton.top = "90px";//90
        this.nextButton.left = "10px";
        this.nextButton.height = "70px";
        this.advancedTexture.addControl(this.nextButton);


        const initialText = "במסך זה יופיעו הנחיות\n\n מאחוריך מספר לבנים לבניית המודל\n\n[אחרי שראינו את האבנים יש להקליק על כפתור [המשך\nהקלקה פרושה להצביע עם הקרן על הכפתור וללחוץ על ההדק";
        let text1 = this.textField;
        text1.text = initialText;//"Hello world";
        text1.color = "white"//"red";
        text1.fontSize = 36;
        text1.top = "-300px";
        text1.height = "600px"
        this.advancedTexture.addControl(text1);

        addEventListener("reportClick", this.handleReportClick.bind(this))
        //this.advancedTexture.focusedControl = inputTextArea;///create bug
        //plane.isVisible = true;
        //plane.dispose();

    }

    handleReportClick(e) {
        if (currentSession && currentSession.part == "learning") {
            if (currentSession) {
                console.log(this.currentScreen)
            }

            if (e.detail.action == "point" && e.detail.details == "on-menu" && e.detail.newElement.name == 'b5' && this.currentScreen == "selectBlock") {
                this.nextButton.isEnabled = true;
            }
            if (e.detail.action == "color" && e.detail.details == "red" && this.currentScreen == "colorButtons") { //&& e.detail.details == "red"
                this.nextButton.isEnabled = true;
            }
            if (e.detail.action == "flip" && e.detail.details == "Y" && this.currentScreen == "rotateButtons") {
                this.nextButton.isEnabled = true;
            }
            if (e.detail.action == "point" && e.detail.details == "on-model" && this.currentScreen == "modelScreen" && e.detail.newElement.metadata.modelTitle == "M1") {
                this.nextButton.isEnabled = true;
            }
            if (e.detail.action == "connect") {
                this.nextButton.isEnabled = true;
            }
            

        }
    }
    ///switch screens by currentScreen. convention:
    /// use function show<CurrentScreen> to show the new screen
    /// use function done<CurrentScreen> if the screen need dispose objects or implemnt user data
    screenDone() {
        switch (this.currentScreen) {
            case "init":
                //this.showPic();/////
                this.showEditID();
                break;
            case "editID":
                let id = this.doneEditID();
                if (id == "record") {
                    this.showModel2record();
                } else {
                    if (id == "takePics") {
                        this.showModel2takePics();
                        //currentSession.initSession();
                    } else {
                        this.showEditGroup();
                    }
                }
                break;
            case "model2record":
                this.doneModel2record();
                break;
            case "model2takePics":
                this.doneModel2takePics();
                break;
            case "editGroup":
                let group = this.doneEditGroup();
                this.showSelectBlock()
                break;
            case "selectBlock":
                this.showColorButtons();
                break;
            case "colorButtons":
                this.showRotateButtons();
                break;
            //this.showConnect();
            case "rotateButtons":
                //////currentSession.initSession();
                currentModel = createModel("car", "M1", 5, 0, -5);//////
                this.showModelScreen();
                break;
            case "modelScreen":
                //this.showGroupIstructions();
                this.showTrainingScreen();
                break;
            case "trainingScreen":
                //this.showGroupIstructions();
                disposeModels();
                currentSession.initSession();
                this.showConnect();
                this.currentScreen = "end";
                break;
            case "examA":
                //this.showConnect();
                currentSession.initExamA();
                this.nextButton.isEnabled = false;
                break;
            case "examB":
                //this.showConnect();
                currentSession.initExamB();
                this.nextButton.isEnabled = false;
                break;
            default:
                console.log("default: " + this.currentScreen);
                break;
        }
    }

    showPic() {
        console.log("in showPic");
        this.textField.text = "foo";
        let image = new BABYLON.GUI.Image("but");
        image.source = "textures/pink_py.png";
        ////image.heightInPixels = 1000;
        //image.widthInPixels = 1000; 
        //image.top = "20px";   
        this.advancedTexture.addControl(image);
        console.log("image.top: " + image.top)
    }

    showEditID() {
        this.currentScreen = "editID";
        this.textField.text = "יש ללחוץ (להקליק) בתוך השדה השחור\n\nלאחר שנפתחה המקלדת, יש להזין את \nהמספר שקיבלת ממנהלת הניסוי \n\nלסיום לחצ/י המשך"

        this.nextButton.isEnabled = false;

        let inputTextArea = new BABYLON.GUI.InputText('id', "");
        inputTextArea.height = "40px";
        inputTextArea.color = "white";
        inputTextArea.fontSize = 48;
        inputTextArea.top = "-120px";
        inputTextArea.height = "70px";
        inputTextArea.width = "200px";
        inputTextArea.onTextChangedObservable.add(() => this.nextButton.isEnabled = true);
        this.advancedTexture.addControl(inputTextArea);

        const keyboard = new BABYLON.GUI.VirtualKeyboard("vkb");
        keyboard.addKeysRow(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "\u2190"]);
        keyboard.connect(inputTextArea);
        keyboard.top = "-10px";
        keyboard.scaleY = 2;
        keyboard.scaleX = 2;
        //keyboard.left = "10px";
        this.advancedTexture.addControl(keyboard);
    }

    doneEditID() {
        let idInputfield = this.advancedTexture.getControlByName("id");
        let theId = idInputfield.text;
        //console.log("theId: " + theId);
        if (theId == "record") {
            ///no session. will continue in showModel2record when we will return "record"
        }
        else {
            currentSession = new Session(theId);
        }
        this.advancedTexture.removeControl(idInputfield);
        idInputfield.dispose();
        let idKeyboard = this.advancedTexture.getControlByName("vkb");
        this.advancedTexture.removeControl(idKeyboard);
        idKeyboard.dispose();
        return theId;
    }
    /////RECORD MODE without session
    showModel2record() {
        this.currentScreen = "model2record";
        near = createNearMenu("record");
        near.isVisible = true;

        this.textField.text = "שם המודל"

        let inputTextArea = new BABYLON.GUI.InputText('id', "");
        inputTextArea.height = "40px";
        inputTextArea.color = "white";
        inputTextArea.fontSize = 48;
        inputTextArea.top = "-120px";
        inputTextArea.height = "70px";
        inputTextArea.width = "200px";
        this.advancedTexture.addControl(inputTextArea);

        const keyboard = new BABYLON.GUI.VirtualKeyboard("vkb");
        keyboard.addKeysRow(["Sman", "car", "dog", "chair", "\u2190"]);
        keyboard.connect(inputTextArea);
        keyboard.top = "-10px";
        keyboard.scaleY = 2;
        keyboard.scaleX = 2;
        //keyboard.left = "10px";
        this.advancedTexture.addControl(keyboard);

    }

    doneModel2record() {
        this.currentScreen = "end";
        let idInputfield = this.advancedTexture.getControlByName("id");
        let theId = idInputfield.text;
        currentModel = createModel(theId, "for record", -5, 0, -5);
        this.advancedTexture.removeControl(idInputfield);
        idInputfield.dispose();
        let idKeyboard = this.advancedTexture.getControlByName("vkb");
        this.advancedTexture.removeControl(idKeyboard);
        idKeyboard.dispose();
        return theId;
    }
    /////END RECORD MODE without session

    showModel2takePics() {
        this.currentScreen = "model2takePics";
        near = createNearMenu("takePics");///for now create regular no record menu
        near.isVisible = true;

        this.textField.text = "שם המודל"

        let inputTextArea = new BABYLON.GUI.InputText('id', "");
        inputTextArea.height = "40px";
        inputTextArea.color = "white";
        inputTextArea.fontSize = 48;
        inputTextArea.top = "-120px";
        inputTextArea.height = "70px";
        inputTextArea.width = "200px";
        this.advancedTexture.addControl(inputTextArea);

        const keyboard = new BABYLON.GUI.VirtualKeyboard("vkb");
        keyboard.addKeysRow(["Sman", "car", "dog", "chair", "\u2190"]);
        keyboard.connect(inputTextArea);
        keyboard.top = "-10px";
        keyboard.scaleY = 2;
        keyboard.scaleX = 2;
        //keyboard.left = "10px";
        this.advancedTexture.addControl(keyboard);

    }

    doneModel2takePics() {
        this.currentScreen = "end";
        let idInputfield = this.advancedTexture.getControlByName("id");
        let theId = idInputfield.text;

        currentModel = createModel(theId, " ", -3, 0, 0);
        rebuild4pics();
        this.advancedTexture.removeControl(idInputfield);
        idInputfield.dispose();
        let idKeyboard = this.advancedTexture.getControlByName("vkb");
        this.advancedTexture.removeControl(idKeyboard);
        idKeyboard.dispose();
        return theId;
    }
    /////END TAKEPICS MODE without session
    showEditGroup() {
        this.currentScreen = "editGroup";
        this.textField.text = "יש להזין את אות הקבוצה שקיבלת ממנהלת הניסוי\nבסיום לחצ/י המשך"

        this.nextButton.isEnabled = false;

        let inputTextArea = new BABYLON.GUI.InputText('group', "");
        inputTextArea.height = "40px";
        inputTextArea.color = "white";
        inputTextArea.fontSize = 48;
        inputTextArea.top = "-120px";
        inputTextArea.height = "70px";
        inputTextArea.width = "200px";
        inputTextArea.onTextChangedObservable.add(() => this.nextButton.isEnabled = true);
        this.advancedTexture.addControl(inputTextArea);

        const keyboard = new BABYLON.GUI.VirtualKeyboard("vkb");
        keyboard.addKeysRow(["A", "B", "C", "D", "E", "F", "\u2190"]);
        keyboard.connect(inputTextArea);
        keyboard.top = "-10px";
        keyboard.scaleY = 2;
        keyboard.scaleX = 2;
        //keyboard.left = "10px";
        this.advancedTexture.addControl(keyboard);
    }

    doneEditGroup() {
        let idInputfield = this.advancedTexture.getControlByName("group");
        let theGroup = idInputfield.text;
        currentSession.group = theGroup;
        this.advancedTexture.removeControl(idInputfield);
        idInputfield.dispose();
        let idKeyboard = this.advancedTexture.getControlByName("vkb");
        this.advancedTexture.removeControl(idKeyboard);
        idKeyboard.dispose();
        return theGroup;
    }

    showSelectBlock() {
        this.currentScreen = "selectBlock";
        this.textField.text = "ניתן לבחור את אחת מאבני הבניין שמאחוריך\nעל ידי לחיצה (הקלקה) על אחת מן הבליטות\n המופיעות על גבי האבן\n לחיצה תצבע את הבליטה בצבע צהוב\n\nנא בחר/י את האבן הארוכה ביותר\n ואז לחצ/י על המשך"
        if (enforceTraining) {
            this.nextButton.isEnabled = false;//////to allow only after clicking
        }
        
    }

    showColorButtons() {
        this.currentScreen = "colorButtons";
        near = createNearMenu("no record"); //was ////N1/5 for screenshots
        //near = {}; ////N1/5 (=without comment)
        near.isVisible = true;
                //    this.textField.text = "מעל האבנים מופיע עכשיו מאחוריך פאנל כחול עם כפתורים\n ניתן לגרור אותו לכל מקום במסך\n\nהכפתורים יפעלו על האבן שנבחרה:\n\n [ red ] כפתורים לבחירת צבע לדוגמא \n  אבן שוכבת אופקית [ / ]\nאבן עומדת [ | ]\nאבן שוכבת אנכית [ -- ] "
        this.textField.text = "מעל אבני הבניין, מופיע לוח עם כפתורים שונים\n שישמשו אותך לאורך הניסוי\n\nנא לחצ/י על כפתור\n לבחירת צבע אדום לאבן\n [red] "
        if (enforceTraining) {
            this.nextButton.isEnabled = false;
        }
    }

    showRotateButtons() {
        this.currentScreen = "rotateButtons";
        this.textField.text = "\n לרשותך גם כפתורים לסיבוב האבן\n\nהכפתורים יפעלו על האבן שנבחרה:\n\n סובב/י את האבן למצב עומד על ידי בחירת כפתור מתאים \n  אבן שוכבת אופקית [ / ]\nאבן עומדת [ | ]\nאבן שוכבת אנכית [ -- ] "
        //    this.textField.text = "מעל האבנים מופיע עכשיו מאחוריך פאנל כחול עם כפתורים\n ניתן לגרור אותו לכל מקום במסך\n\nהכפתורים יפעלו על האבן שנבחרה:\n\n [ red ] כפתורים לבחירת צבע לדוגמא \n  אבן שוכבת אופקית [ / ]\nאבן עומדת [ | ]\nאבן שוכבת אנכית [ -- ] "
        if (enforceTraining) {
            this.nextButton.isEnabled = false;
        }
    }

    showModelScreen() {
        this.currentScreen = "modelScreen";
        if (enforceTraining) {
            this.nextButton.isEnabled = false;
        }
        /////
        this.textField.text = "משמאלך בסיס למודל\n\nבחר/י את המודל\n M1 \nעל ידי לחיצה (הקלקה) על הבליטה שבו\n כך שהיא תיצבע בצבע צהוב\n\nלאחר מכן לחצ/י המשך";
        /*
        switch (currentSession.group) {
            case "A":
                this.textField.text = "מאחורי אבני הבניין ישנם שני בסיסים נוספים.\n\nנא בחר/י את המודל\n M1\n על ידי לחיצה על הבליטה והפיכתה לצבע צהוב\n\nלאחר מכן לחצ/י המשך";
                break;
            case "B":
                this.textField.text = "מימינך ומשמאלך בסיסים לשני מודלים\nשני מודלים נוספים יוצגו לפניך בהמשך\nבחר/י את המודל\nM1\nעל ידי לחיצה (הקלקה) על הבליטה שבו\n כך שהיא תיצבע בצבע צהוב\nלאחר מכן לחצ/י המשך";
                break;
            case "C":
                this.textField.text = "משמאלך בסיס למודל\nשלושה מודלים נוספים יוצגו לפניך בהמשך\n\nבחר/י את המודל\n M1 \nעל ידי לחיצה (הקלקה) על הבליטה שבו\n כך שהיא תיצבע בצבע צהוב\n\nלאחר מכן לחצ/י המשך";
                break;
            default:
                break;
        }
        */
    }

    showTrainingScreen() {
        if (enforceTraining) {
            this.nextButton.isEnabled = false;
        }
        this.currentScreen = "trainingScreen";
        this.textField.text = "לפני הוספת אבן למודל יש לבחור בליטה במודל\n ובליטה בחלק המתחבר כך שיצבעו בצבע צהוב\n לאחר מכן יש ללחוץ על כפתור [>>]. לאחר \nלחיצה על כפתור זה, האבן תוצמד למודל\n והנקודות שנבחרו יתלכדו\n\nלהסרת האבן האחרונה שנוספה למודל \nיש ללחוץ על כפתור [<<].כעת \nחבר/י מספר אבנים למודל על פי הנחיות המנחה"
    }
    showConnect() {
        this.currentScreen = "connect";
        switch (currentSession.group) {
            case "A":
                this.textField.text = "מימינך ומשמאלך בסיסים לשני מודלים\nמאחורי אבני הבניין ישנם שני בסיסים נוספים\nרק לאחר קבלת הוראה מהמנחה ניתן \nלהתחיל לבנות את המודלים בהתאם\nלהסברים שיופיעו מעל אבני הבניין. בהצלחה";
                break;
            case "B":
                this.textField.text = "מימינך ומשמאלך בסיסים לשני מודלים\nשני מודלים נוספים יוצגו לפניך בהמשך\nרק לאחר קבלת הוראה מהמנחה ניתן \nלהתחיל לבנות את המודלים בהתאם\nלהסברים שיופיעו מעל אבני הבניין. בהצלחה";
                break;
            case "C":
                this.textField.text = "משמאלך שוב הבסיס למודל\nשלושה מודלים נוספים יוצגו לפניך בהמשך\nרק לאחר קבלת הוראה מהמנחה ניתן \nלהתחיל לבנות את המודלים בהתאם\nלהסברים שיופיעו מעל אבני הבניין. בהצלחה";
                break;
            default:
                break;
        }
        if (enforceTraining) {
            this.nextButton.isEnabled = false;
        }
        currentSession.part = "training"
    }

    showExamA() {
        this.nextButton.isEnabled = true;
        this.currentScreen = "examA";
        this.textField.text = "בשלב הבא יש לבנות מודל במינימום זמן\nמי שיסיים את הבנייה בשלב זה ובשלב\nהבא בזמן המהיר ביותר, יקבל בונוס\nנא לחצ/י המשך ואז הסתובב/י והתחל/י בבנייה"
    }

    showExamB() {
        this.nextButton.isEnabled = true;
        this.currentScreen = "examB";
        this.textField.text = "הגעת לשלב האחרון בו יש לבנות שני מודלים במינימום זמן\nמי שיסיים את הבנייה של השלב הזה והשלב\n הקודם בזמן הקצר ביותר יקבל בונוס\nנא לחצ/י המשך ואז הסתובב/י והתחל/י בבנייה"
    }

    showLastScreen() {
        this.currentScreen = "lastScreen";
        this.textField.text = "תודה רבה. הורד את המשקפיים והחזר אותם לנסיין"
        this.nextButton.isEnabled = false;
    }

    hide() {
        this.plane.isVisible = false;
    }

}

class FbMessages {
    dynamicTexture;
    mat;
    plane;
    picPLane;
    advancedTexture4Pic = null;
    image;
    constructor(text, x = 0, y = 2.5, z = 2, pic = null) {
        ///Set font
        var font_size = 24;
        var font = "bold " + font_size + "px Arial";

        ///Set height for plane
        var planeHeight = 0.5;

        ///Set height for dynamic texture
        var DTHeight = 1.5 * font_size; //or set as wished

        ///Calcultae ratio
        var ratio = planeHeight / DTHeight;

        ///Use a temporay dynamic texture to calculate the length of the text on the dynamic texture canvas
        var temp = new BABYLON.DynamicTexture("DynamicTexture", 64, scene);
        var tmpctx = temp.getContext();
        tmpctx.font = font;
        var DTWidth = tmpctx.measureText(text).width + 8;
        temp.dispose();
        ///Calculate width the plane has to be 
        var planeWidth = DTWidth * ratio;

        ///Create dynamic texture and write the text
        this.dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", { width: DTWidth, height: DTHeight }, scene, false);
        this.mat = new BABYLON.StandardMaterial("mat", scene);
        this.mat.diffuseTexture = this.dynamicTexture;
        this.dynamicTexture.drawText(text, null, null, font, "#000000", "#ffffff", true);

        ///Create plane and set dynamic texture as material
        this.plane = BABYLON.MeshBuilder.CreatePlane("plane", { width: planeWidth, height: planeHeight }, scene);
        this.plane.material = this.mat;
        this.plane.position.y = y;
        this.plane.position.z = z;
        this.plane.position.x = x;
        this.plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;

        ///create plane for pic instructions
        if (pic) {
            let picHeight = 1.5;
            let picWidth = 1.5;
            this.picPLane = BABYLON.MeshBuilder.CreatePlane("plane", { width: picWidth, height: picHeight }, scene);
            this.picPLane.material = this.mat;
            this.picPLane.position.y = y + picHeight / 2 + planeHeight / 2;
            this.picPLane.position.z = z;
            this.picPLane.position.x = x;
            this.picPLane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
            this.advancedTexture4Pic = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(this.picPLane);

            this.image = new BABYLON.GUI.Image("but");
            this.image.source = pic;//"textures/pink_py.png";
            this.advancedTexture4Pic.addControl(this.image);

            this.advancedTexture4Pic.background = 'green';
        }
    }

    setY(newY) {
        this.plane.position.y = newY;
    }

    hide() {
        this.plane.isVisible = false;
    }
    show() {
        this.plane.isVisible = true;
    }
    dispose() {
        this.dynamicTexture.dispose();
        this.mat.dispose();
        this.plane.dispose();
        if (this.picPLane) {
            this.picPLane.dispose();
        }
        if (this.advancedTexture4Pic) {
            this.advancedTexture4Pic.dispose();
        }

    }
}

class Timer {
    dynamicTexture;
    textureSize;
    mat;
    plane;
    currTime = 0;
    constructor(x = 1.5, y = 3.5, z = 2) {
        const text = '00:00 ';
        ///Set font
        var font_size = 24;
        this.font = "bold " + font_size + "px Arial";

        ///Set height for plane
        var planeHeight = 0.5;

        ///Set height for dynamic texture
        var DTHeight = 1.5 * font_size; //or set as wished

        ///Calcultae ratio
        var ratio = planeHeight / DTHeight;

        ///Use a temporay dynamic texture to calculate the length of the text on the dynamic texture canvas
        var temp = new BABYLON.DynamicTexture("DynamicTexture", 64, scene);
        var tmpctx = temp.getContext();
        tmpctx.font = this.font;
        var DTWidth = tmpctx.measureText(text).width + 8;
        temp.dispose();
        ///Calculate width the plane has to be 
        var planeWidth = DTWidth * ratio;

        ///Create dynamic texture and write the text
        this.dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", { width: DTWidth, height: DTHeight }, scene, false);
        this.mat = new BABYLON.StandardMaterial("mat", scene);
        this.mat.diffuseTexture = this.dynamicTexture;
        this.dynamicTexture.drawText(text, null, null, this.font, "#000000", "#ffffff", true);

        ///Create plane and set dynamic texture as material
        this.plane = BABYLON.MeshBuilder.CreatePlane("plane", { width: planeWidth, height: planeHeight }, scene);
        this.plane.material = this.mat;
        this.plane.position.y = y;
        this.plane.position.z = z;
        this.plane.position.x = x;
        this.plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
        this.textureSize = this.dynamicTexture.getSize();
        this.hide();
    }

    startTimer() {
        this.currTime = 0;
        this.timerInterval = setInterval(this.updateTime.bind(this), 1000);
        this.show();
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    updateTime() {
        this.currTime++;
        //this.dynamicTexture.drawText(text, null, null, font, "#000000", "#ffffff", true);
        //let newText = " שניות " + this.currTime.toString();
        let newText = this.secToTimeString(this.currTime);
        const ctx = this.dynamicTexture.getContext();
        ctx.clearRect(0, 0, this.textureSize.width, this.textureSize.height);
        //ctx.fillText(newText, textureSize.width / 2, textureSize.height / 2 + 70);
        this.dynamicTexture.drawText(newText, null, null, this.font, "#000000", "#ffffff", true);
        this.dynamicTexture.update();
    }

    secToTimeString(sec) {
        const minutes = Math.floor(sec / 60);
        const remainingSeconds = sec % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    setY(newY) {
        this.plane.position.y = newY;
    }

    hide() {
        this.plane.isVisible = false;
    }
    show() {
        this.plane.isVisible = true;
    }
    dispose() {
        this.dynamicTexture.dispose();
        this.mat.dispose();
        this.plane.dispose();

    }
}
