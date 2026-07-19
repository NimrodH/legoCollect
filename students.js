"use strict"
let currentSession = null;///will be created in messages
let allowReport = false;
// Reward for each successfully completed Group A model.
// Array index 0 is the first completed model, index 1 is the second, etc.
const REPEATED_MODEL_REWARDS = [20, 18, 16, 14, 12, 10, 6, 4];
// Group C alternates between two partially built models.
// M1/Sman and M2/Scat each receive five building steps.
const GROUP_C_MODEL_SEQUENCE = [
    "M1", "M1",
    "M2", "M2", "M2",
    "M1", "M1",
    "M2",
    "M1",
    "M2"
];
async function saveUserAction(actionType, ActionDetails, actionId, block, model, step, time, user, group, part, modelOrder) {
    if (!allowReport) {
        return;
    }
    let bodyData = {
        'ActionType': actionType,
        'ActionDetails': ActionDetails,
        'actionId': actionId,
        'block': block,
        'group': group,
        'model': model,
        'step': step,
        'time': time,
        'user': user + part,
        'part': part,
        'modelOrder': modelOrder
    }
    var result = await postData(usersURL, bodyData);
    //console.log("saveUserAction: "+ actionType);
}//

// Save the participant's final result when they select the NO button.
// This uses a separate fetch request from the regular action reporting.
async function saveNoDecision(userId, group, completedModelCount) {
    const bodyData = {
        // Tell the Lambda that this request belongs in the results table.
        requestType: "userResult",

        user: String(userId),
        group: group,
        completedModelCount: completedModelCount,
        time: Date.now()
    };

    try {
        await postData(usersURL, bodyData);
        console.log("NO decision saved:", bodyData);
    } catch (error) {
        console.error("Could not save NO decision:", error);
    }
}

class Session {
    userId;
    actionId = 0;/// running number for any action (click) the user done - to be used on the database table
    connectedStage = 0;///the order number of true conection action (no matter which model) in the session
    group;///each group handle differant no. of models when training
    currentModelInArray = 0;///index in array of shown model
    // Number of Group A models completed during this session.
    // It is also used as the index in GROUP_A_MODEL_REWARDS.
    completedRepeatedModelCount = 0;
    fb;///one line message to the larner. usage: //this.fb = new FbMessages("בוקר אביבי ושמח");
    trainingModelData;///array item per line. each line is object with the following props:
    part = "learning"///learning, training, examA, examB
    modelInConnectedStage;///array: item i represent  the i correct connection that done (in any models). the value is the title of the model to use for it
    worldByModel;///model Mn will be in the world that is the value of item n
    // References to the current Group C M1/M2 pair.
    // We cannot use getModel() after the first pair because completed pairs
    // remain in modelsArray with the same M1 and M2 titles.
    activeRepeatedModels = {};
    timer;
    msgNextBtn; ///the next button we will get from messages when it creat this session
    // Order of the repeated model currently being built.
    // The first model is 1, the next model is 2, etc.
    modelOrder = 1;
    //timer;//
    /*
    srcPoint
    destPoint
    destBlock
    color
    rotation
    type
    step
    */

    constructor(id) {
        this.userId = id;
        addEventListener("reportClick", this.handleReportClick.bind(this))
    }

    modelStepLabels(modelName, modelTitle) {
        const steps = this.trainingModelData.filter(x => x.modelName == modelName).length;
        return Array(steps).fill(modelTitle);
    }

    handleReportClick = (e) => {
        // Report regular building actions only after the reporting period starts.
        // The Yes/No buttons do not dispatch reportClick events.
        if (allowReport && currentModel) {
            const modelMx = currentModel.metadata.modelTitle;

            // Connect actions are handled separately by reportConnect().
            if (e.detail.action !== "connect") {
                saveUserAction(
                    e.detail.action,
                    e.detail.details,
                    this.actionId++,
                    e.detail.newElement.name,
                    modelMx,
                    currentModel.metadata.numOfBlocks + 1,
                    Date.now(),
                    this.userId,
                    this.group,
                    this.part,
                    this.modelOrder
                );
            }
        }
    };
    async initSession() {
        this.timer = new Timer()
        //allowReport = true;

        //elementsMenu.metadata.labelObj =  new FbMessages("תפריט אבני בניין",0,1,0);    
        this.trainingModelData = await loadModelData();
        //this.requestedModelName;///we will set it when we ask user to change model 
        ///we use it when comparing its selection in reportConnect
        ///the value of item i is the model name to use in overall stage i in this session
        ///the next stage number of spsific model is kept on the model
        if (this.group == "A" || this.group == "B") {
            // Groups A and B repeatedly build the Sman/M1 model.
            this.modelInConnectedStage =
                this.modelStepLabels("Sman", "M1");
        } else if (this.group == "C") {
            // Group C builds one Sman/M1 and one Scat/M2 as a pair.
            this.modelInConnectedStage = [
                ...GROUP_C_MODEL_SEQUENCE
            ];
        } else if (this.userId == 666) {
            this.modelInConnectedStage = ["M1", "M1", "M4"];
        } else {
            this.modelInConnectedStage = ["M1", "M1", "M4", "M4", "M4", "M2", "M2", "M2", "M2", "M3", "M3", "M3", "M2", "M2", "M2", "M2", "M4", "M4", "M4", "M4", "M1", "M1", "M1", "M3", "M3", "M3", "M1", "M1", "M1", "M4", "M4", "M4", "M4", "M2", "M2", "M2", "M3", "M3", "M3", "M1", "M1", "M1", "M3", "M3"];
        }        //this.worldByModel; ///model Mn will be in the world that is the value of item n
        let m1;
        let m2;
        let m3;
        let m4;
        if (this.group == "A" || this.group == "B") {
            // Groups A and B build the same repeated Sman/M1 model.
            m1 = createModel("Sman", "M1", 6, 0, 3);
        } else if (this.group == "C") {
            // Group C uses two models in two separate worlds.
            m1 = createModel("Sman", "M1", 6, 0, 3);
            m2 = createModel("Scat", "M2", 6, 0, 3);

            // Keep direct references because completed pairs remain in modelsArray.
            this.activeRepeatedModels = {
                M1: m1,
                M2: m2
            };
        } switch (this.group) {///TODO: build more then one model as defined for the group
            case "A":
            case "B":
                // Groups A and B each use only the repeated M1 model in W1.
                this.worldByModel = { "M1": "W1" };
                break;
            case "C":
                // M1 and M2 use different skies and grid colors.
                // setWorld() controls the appropriate sky and grid for W1/W2.
                this.worldByModel = {
                    M1: "W1",
                    M2: "W2"
                };

                // The experiment starts in M1's world.
                // Only the currently active model is visible.
                setVisibleModel(m1, true);
                setVisibleModel(m2, false);
                break;
            case "D":
                currentModel = createModel("chair", "M2", 5, 0, 5);
                let modelData = this.trainingModelData.filter(x => x.modelName == currentModel.metadata.modelName);
                reBuildModel(modelData, modelData.length + 1);
                currentModel = createModel("Sman", "M4", -5, 0, -5);
                modelData = this.trainingModelData.filter(x => x.modelName == currentModel.metadata.modelName);
                reBuildModel(modelData, modelData.length + 1);
                currentModel = createModel("car", "M1", 5, 0, -5);
                modelData = this.trainingModelData.filter(x => x.modelName == currentModel.metadata.modelName);
                reBuildModel(modelData, modelData.length + 1);
                currentModel = createModel("dog", "M3", -5, 0, 5);
                modelData = this.trainingModelData.filter(x => x.modelName == currentModel.metadata.modelName);
                reBuildModel(modelData, modelData.length + 1);
                ////N1/5
                messageBox.hide();
                elementsMenu.metadata.labelObj.hide();
                ///for M1 that is in 5, 0, -5
                //camera.position = new BABYLON.Vector3( 5, 1.5, 0);
                //camera.setTarget(new BABYLON.Vector3( 5, 0, -5));
                //////for M4 and M3 that is in -5, 0, -5
                //camera.position = new BABYLON.Vector3( -7, 1.5, 0);
                //camera.setTarget(new BABYLON.Vector3( -5, 0, -5));
                //////for _____ that is in 5, 0, 5
                camera.position = new BABYLON.Vector3(12, 1.0, 1);
                camera.setTarget(new BABYLON.Vector3(5, 0, 5));

                elementsMenu.position.x = 100;
                //if (this.userId == "w1") {
                //    console.log("W1!!!");
                setWorld(this.userId);
                //}

                ////N1/5
                break;
            case "E":
                elementsMenu.metadata.labelObj.hide();
                elementsMenu.position.x = 5;
                currentModel = createModel("car", "M1", 0, 0, 0);
                currentModel.metadata.labelObj.hide();
                ground.material.lineColor = colorName2Vector("selected");//yellow
                break;

            default:
                break;
        }
        if (this.group == "A" || this.group == "B" || this.group == "C") {
            ///the normal groups. (differ than rebuild (D) or takepics)
            /*
            let modelLabel = this.modelInConnectedStage[this.connectedStage];
            currentModel = getModel(modelLabel);///connectedStage = 0
            currentWorld = this.worldByModel[modelLabel];
            setWorld(currentWorld);///TODO:in setWorld show only relevent models follwing session.worldByModel
            let msg = "Please do step 1 in Model " + currentModel.metadata.modelTitle + ", following the above picture";
            let mName = currentModel.metadata.modelName;
            let pic = "textures/" + mName + "1.JPG";
            console.log("pic: " + pic)
            this.doFbMessage(msg, pic);
            */
            this.runPart();
        }
    }

    runPart() {
        let delButton = (near.children).filter(b => b.name == "delete")[0];
        delButton.isVisible = false;///if we allow to delete correct block we will get connectedStage++ twice
        let modelLabel = this.modelInConnectedStage[this.connectedStage];
        currentModel =
            this.group === "C"
                ? this.activeRepeatedModels[modelLabel]
                : getModel(modelLabel);        // Begin the continuous reporting period when the participant starts
        // building the first actual model. Reporting remains enabled through
        // all repeated models and the messages displayed between them.
        // Reporting starts when Groups A, B, or C begin actual building.
        if (
            this.group === "A" ||
            this.group === "B" ||
            this.group === "C"
        ) {
            allowReport = true;
        }
        currentWorld = this.worldByModel[modelLabel];
        setWorld(currentWorld);///TODO:in setWorld show only relevent models follwing session.worldByModel
        let msg = "Please do step 1 in Model " + currentModel.metadata.modelTitle + ", following the above picture";
        let mName = currentModel.metadata.modelName;
        let pic = "textures/" + mName + "1.JPG";
        //console.log("pic: " + pic);
        this.doFbMessage(msg, pic);
    }

    nextStage() {
        console.log("nextStage");
        ///TODO: delete old models (they alreadtbuilt now)
        disposeModels();
        ///TODO: must add "this.part" to the users records on the data base
        switch (this.part) {
            case "training":
                this.doFbMessage("סיימת את שלב האימון. התבונן/י במסך הירוק מאחוריך להוראות");
                messageBox.showExamA();///when he will click there "next" we will call initExamA
                break;
            case "examA":
                this.timer.stopTimer();
                this.doFbMessage("סיימת את שלב הרצה 1 מתוך 2. התבונן/י במסך הירוק מאחוריך להוראות");
                messageBox.showExamB();///when he will click there "next" we will call initExamB
                break;
            case "examB":
                this.timer.stopTimer();
                this.doFbMessage("סיימת את הניסוי. התבונן/י במסך הירוק מאחוריך לפרידה");
                messageBox.showLastScreen();
                near.isVisible = false;
                break;

            default:
                break;
        }
    }

    initExamA() {
        ///we will use the same this.trainingModelData because we use same models as in training
        this.part = "examA";
        let m1 = createModel("car", "M1", 5, 0, -5);
        if (this.userId == 666) {
            this.modelInConnectedStage = ["M1", "M1"];
        } else {
            this.modelInConnectedStage = ["M1", "M1", "M1", "M1", "M1", "M1", "M1", "M1", "M1", "M1", "M1"];
        }
        this.worldByModel = { "M1": "W1", "M2": "W1", "M3": "W1", "M4": "W1" };///we need here only M1
        this.connectedStage = 0;
        this.timer.startTimer();
        this.runPart();
    }

    initExamB() {
        ///we will use the same this.trainingModelData because we use same models as in training
        this.part = "examB";
        let m2 = createModel("chair", "M2", -5, 0, -5);
        let m3 = createModel("dog", "M3", 5, 0, -5);
        if (this.userId == 666) {
            this.modelInConnectedStage = ["M3", "M3"];
        } else {
            this.modelInConnectedStage = ["M3", "M3", "M3", "M2", "M2", "M2", "M2", "M3", "M3", "M3", "M2", "M2", "M2", "M2", "M3", "M3", "M3", "M3", "M3", "M2", "M2", "M2"];
        }
        this.worldByModel = { "M1": "W1", "M2": "W1", "M3": "W1", "M4": "W1" };///we need here only M2 & M3
        this.connectedStage = 0;
        this.timer.startTimer();
        this.runPart();
    }

    ///to be removed when all wil became by events
    /*
        reportClick(action, details, newElement) {
            if (currentModel) {
                let modelMx = currentModel.metadata.modelTitle;
                saveUserAction(action, details, this.actionId++, newElement.name, modelMx, currentModel.metadata.numOfBlocks + 1, Date.now(), this.userId, this.group, this.part,this.modelOrder)
            }
        }
    */
    reportConnect(newElement) {
        if (!allowReport) {

            return;
        }
        if (this.group == "E") {
            return;
        }
        //console.log("reportConnect");
        ///for each mode write the model/ write user time and error / create next automtic stage
        let isCorect = true;
        let wrongItems = [];
        let step = newElement.metadata.blockNum;
        let destModelLabel = this.modelInConnectedStage[this.connectedStage];

        // Group A can contain previous completed M1 models.
        // Always validate the connection against the new active model,
        // rather than the first M1 returned from modelsArray.
        // Repeated groups can retain completed models with duplicate titles.
        // currentModel always identifies the model currently being built.
        let destModel =
            this.group === "A" ||
                this.group === "B" ||
                this.group === "C"
                ? currentModel
                : getModel(destModelLabel);        ////const dataLine = this.trainingModelData.filter(el => (el.step == step) && (el.modelName == currentModel.metadata.modelName))[0];
        const dataLine = this.trainingModelData.filter(el => (el.step == step) && (el.modelName == destModel.metadata.modelName))[0];
        //console.log("dataLine: ");
        //console.log(dataLine);
        if (!dataLine) {
            this.doFbMessage("no more steps");
            console.log("missing line. no more steps?");
            return
        }
        let colorName = colorVector2Name(newElement.material.diffuseColor);
        //console.log("colorName: " + colorName + "  " + dataLine.color);
        if (colorName !== dataLine.color) {
            isCorect = false;
            wrongItems.push("color");
        }

        let rotationName = rotationVector2Name(newElement.rotation);
        //console.log("rotationName: " + rotationName + "  " + dataLine.rotation);
        if (rotationName !== dataLine.rotation) {
            isCorect = false;
            wrongItems.push("rotation");
        }

        let srcPointName = newElement.metadata.connection;
        //console.log("srcPointName: " + srcPointName + "  " + dataLine.srcPoint);
        if (srcPointName !== dataLine.srcPoint) {
            isCorect = false;
            wrongItems.push("Block-Point");
        }

        let destPointName = newElement.metadata.connectedTo;
        //console.log("destPointName: " + destPointName + "  " + dataLine.destPoint);
        if (destPointName !== dataLine.destPoint) {
            isCorect = false;
            wrongItems.push("destenation-point");
        }

        let typeName = newElement.name;
        //console.log("typeName: " + typeName + "  " + dataLine.type);
        if (typeName !== dataLine.type) {
            isCorect = false;
            wrongItems.push("block-type");
        }

        let destBlockName = newElement.metadata.destBlock;
        //console.log("destBlockName: " + destBlockName + "  " + dataLine.destBlock);
        if (destBlockName.toString() !== dataLine.destBlock.toString()) {
            isCorect = false;
            wrongItems.push("destenation-block");
        }
        /*
        ///we assume block 0 will never be :newElement
        // let modelName = newElement.parent.metadata.modelName;
        if (currentModel.metadata.modelName !== dataLine.modelName) {
            isCorect = false;
            wrongItems.push("model");
        }
        */
        ///we assume block 0 will never be :newElement
        let modelName = newElement.parent.metadata.modelName;
        //console.log("modelName: " + modelName);
        //console.log("dataLine.modelName: " + dataLine.modelName);
        if (modelName !== dataLine.modelName) {
            isCorect = false;
            wrongItems.push("model");
        }
        if (isCorect) {
            //this.fb.dispose()
            //this.fb = new FbMessages((step + 1) + " יפה מאד. המשך לשלב")
            this.connectedStage++;

            if (this.group == "A" || this.group == "B" || this.group == "C") {
                let modelMx = currentModel.metadata.modelTitle;
                saveUserAction("connect", "CORRECT", this.actionId++, typeName, modelMx, step, Date.now(), this.userId, this.group, this.part, this.modelOrder);
                //console.log("this.connectedStage: " + this.connectedStage);
                //console.log(this.modelInConnectedStage.length + 1);
                // Show the completion question only after every required step is finished.
                if (
                    this.connectedStage ==
                    this.modelInConnectedStage.length
                ) {
                    // Groups A and B complete one model.
                    // Group C completes one M1/M2 pair.
                    if (
                        this.group == "A" ||
                        this.group == "B" ||
                        this.group == "C"
                    ) {                        // Select the reward by completion order.
                        const nextModelReward =
                            REPEATED_MODEL_REWARDS[this.completedRepeatedModelCount];

                        this.completedRepeatedModelCount++;

                        if (this.group === "C") {
                            // Both Group C models are now complete.
                            const completedM1 = this.activeRepeatedModels.M1;
                            const completedM2 = this.activeRepeatedModels.M2;

                            // Neither completed model may react to connection-dot clicks.
                            disableModelConnectionDots(completedM1);
                            disableModelConnectionDots(completedM2);

                            // Temporarily show both models while gathering them above the buttons.
                            // During normal building only the model in the active world is visible.
                            setVisibleModel(completedM1, true);
                            setVisibleModel(completedM2, true);

                            // Animate M1 first. M2 starts after M1 reaches its final position,
                            // allowing animateModelAboveButtons() to position M2 beside it.
                            animateModelAboveButtons(completedM1);

                            window.setTimeout(() => {
                                animateModelAboveButtons(completedM2);
                            }, 2100);
                        } else {
                            // Groups A and B complete one model per repeated unit.
                            disableModelConnectionDots(currentModel);

                            if (this.group === "A") {
                                // Group A gathers the completed model above the buttons.
                                animateModelAboveButtons(currentModel);
                            } else {
                                // Group B eliminates the completed model block by block.
                                eliminateModelBlockByBlock(currentModel);
                            }
                        }
                        // Hide the complete Near Buttons panel while asking whether
                        // the participant wants to build another model.
                        if (near) {
                            near.isVisible = false;
                        }

                        // RLM before the question mark keeps Hebrew punctuation
                        // on the correct visual side.
                        const rewardText = nextModelReward + ' ש"ח';
                        const completionMessage =
                            this.group === "C"
                                ? "בנית את שני המודלים בהצלחה\n" +
                                "באפשרותך לבנות זוג מודלים נוסף\n" +
                                "אם תסיים אותם תקבל: " + rewardText + "\n" +
                                "האם תרצה להמשיך לזוג הבא\u200F?"
                                : "בנית עוד מודל בהצלחה\n" +
                                "באפשרותך לבנות מודל נוסף זהה לחלוטין\n" +
                                "אם תסיים אותו תקבל: " + rewardText + "\n" +
                                "האם תרצה להמשיך למודל הבא\u200F?";

                        this.doFbMessage(
                            completionMessage,
                            null,
                            ["yes", "No"],
                            4.2,
                            buttonName => {
                                if (buttonName.toLowerCase() === "yes") {
                                    this.resetRepeatedModel();
                                } else {
                                    // For Group C this reports completed pairs.
                                    saveNoDecision(
                                        this.userId,
                                        this.group,
                                        this.completedRepeatedModelCount
                                    );

                                    this.doFbMessage(
                                        "הניסוי הסתיים. תודה על ההשתתפות",
                                        null,
                                        null,
                                        4.2
                                    );
                                }
                            }
                        );
                        //allowReport = false;
                        return;
                    }
                    ///other groups continue as before
                    this.nextStage();
                    return;
                } if (this.modelInConnectedStage[this.connectedStage] == currentModel.metadata.modelTitle) {
                    //this.doFbMessage(currentModel.metadata.modelTitle + ":במודל זה " + (step + 1) + " יפה מאד. המשך לשלב");
                    let msg = "Very good. Please do next step " + (step + 1) + " in this Model (" + currentModel.metadata.modelTitle + ")";
                    let mName = currentModel.metadata.modelName;
                    this.doFbMessage(msg, "textures/" + mName + (step + 1) + ".JPG");
                } else {
                    let nextModelLabel = this.modelInConnectedStage[this.connectedStage];
                    currentModel =
                        this.group === "C"
                            ? this.activeRepeatedModels[nextModelLabel]
                            : getModel(nextModelLabel);
                    let nextWorld = this.worldByModel[nextModelLabel];
                    if (nextWorld !== currentWorld) {
                        setWorld(nextWorld);///will update currentWorld in the function
                    }
                    step = currentModel.metadata.numOfBlocks;
                    //this.doFbMessage(nextModelLabel + ":במודל  " + (step + 1) + " יפה מאד. בצע שלב");

                    let msg = "Very good. Please do step " + (step + 1) + " in Model " + nextModelLabel + " (located in other place)"
                    let mName = currentModel.metadata.modelName;
                    this.doFbMessage(msg, "textures/" + mName + (step + 1) + ".JPG");
                }
            } else {///E
                let msg = this.doFbMessage((step + 1));
            }
        } else {///wrong move
            //this.fb.dispose()
            //this.fb = new FbMessages((step + 1) + " מהלך שגוי. הורד את האבן [<<] ונסה שוב")
            let msg = (step + 1) + " מהלך שגוי. הורד את האבן [<<] ונסה שוב";
            let mName = currentModel.metadata.modelName;
            this.doFbMessage(msg, "textures/" + mName + step + ".JPG");
            let modelMx = currentModel.metadata.modelTitle;
            saveUserAction("connect", "WRONG: " + wrongItems.toString(), this.actionId++, typeName, modelMx, step, Date.now(), this.userId, this.group, this.part, this.modelOrder);
            let addButton = (near.children).filter(b => b.name == "connect")[0];
            let delButton = (near.children).filter(b => b.name == "delete")[0];
            addButton.isVisible = false;
            delButton.isVisible = true;
        }
    }

    reportDelete() {
        if (!allowReport) {
            return;
        }
        if (this.group == "E") {
            let addButton = (near.children).filter(b => b.name == "connect")[0];
            let delButton = (near.children).filter(b => b.name == "delete")[0];

            if (addButton) addButton.isVisible = true;
            if (delButton) delButton.isVisible = true;

            return;
        }

        //console.log("reportDelete");
        ///it was worng so we still didnt incremnt connectedStage
        //console.log("this.connectedStage: " + this.connectedStage);
        let msg;
        let mName;
        let step;
        if (this.modelInConnectedStage[this.connectedStage] == currentModel.metadata.modelTitle) {
            step = currentModel.metadata.numOfBlocks;
            msg = "Please do again step " + (step + 1) + " in this Model (" + currentModel.metadata.modelTitle + ")";
            mName = currentModel.metadata.modelName;
        } else {
            let nextModelLabel = this.modelInConnectedStage[this.connectedStage];
            let nextModel = getModel(nextModelLabel);
            step = nextModel.metadata.numOfBlocks;
            mName = nextModel.metadata.modelName;
            msg = "Please do again step " + (step + 1) + " in Model (" + nextModel.metadata.modelTitle + ")";
        }
        this.doFbMessage(msg, "textures/" + mName + (step + 1) + ".JPG");
        let addButton = (near.children).filter(b => b.name == "connect")[0];
        let delButton = (near.children).filter(b => b.name == "delete")[0];
        addButton.isVisible = true;
        delButton.isVisible = false;/// if he will remove good block we will have connectedStage++ twice
    }

    ///move not done (i.e. missing selected point).
    /// we have another function "session.reportConnect" when connection done
    reportForbiddenMove(wrongConnection, wrongModelConnection) {
        console.log("reportWrongMove: ");
    }
    doFbMessage(
        message,
        pic,
        buttons = null,
        y = 2.5,
        onButtonClick = null
    ) {
        if (this.fb) {
            this.fb.dispose();
        }

        this.fb = new FbMessages(
            message,
            0,
            y,
            2,
            pic,
            buttons,
            onButtonClick
        );
    }

    // Start another identical Group A model.
    //
    // The completed model is not removed. It remains visible in its final
    // display position, with its connection dots disabled.
    //
    // Everything needed for building is reset to the same state that existed
    // before the user selected the original base block.
    // Start another identical model for Group A or Group B.
    //
    // Group A leaves the previous completed model displayed above the buttons.
    // Group B has already started eliminating the previous model block by block.
    resetRepeatedModel() {
        // Start a new repeated unit while preserving the global actionId.
        this.modelOrder++;
        this.connectedStage = 0;
        selectedConnection = null;

        if (this.group === "C") {
            // Group C begins a fresh M1/M2 pair.
            const newM1 = createModel("Sman", "M1", 6, 0, 3);
            const newM2 = createModel("Scat", "M2", 6, 0, 3);

            this.activeRepeatedModels = {
                M1: newM1,
                M2: newM2
            };

            // Restore the complete alternating sequence for the new pair.
            this.modelInConnectedStage = [
                ...GROUP_C_MODEL_SEQUENCE
            ];

            // Every new pair begins with M1 in W1.
            currentModel = newM1;
            currentWorld = "W1";

            setVisibleModel(newM1, true);
            setVisibleModel(newM2, false);
            setWorld(currentWorld);
        } else {
            // Groups A and B begin another Sman/M1 model.
            currentModel = createModel("Sman", "M1", 6, 0, 3);
            currentWorld = "W1";
            setWorld(currentWorld);
        }
        // Restore the building buttons.
        if (near) {
            near.isVisible = true;

            const addButton = near.children.find(
                button => button.name === "connect"
            );

            const deleteButton = near.children.find(
                button => button.name === "delete"
            );

            if (addButton) {
                addButton.isVisible = true;
            }

            if (deleteButton) {
                deleteButton.isVisible = false;
            }
        }

        // Allow block connections and action reporting again.
        //allowReport = true;

        // Display the first-step instruction for the new model.
        const modelName = currentModel.metadata.modelName;

        this.doFbMessage(
            "Please do step 1 in Model " +
            currentModel.metadata.modelTitle +
            ", following the above picture",
            "textures/" + modelName + "1.JPG"
        );
    }

}
//this.fb = new FbMessages("בוקר אביבי ושמח");
//let modelData = modelDataAll.filter(x => x.modelName == currentModel.metadata.modelName);