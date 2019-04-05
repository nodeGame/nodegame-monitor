/**
 * # WaitRoomView widget for nodeGame
 * Copyright(c) 2019 Stefano Balietti
 * MIT Licensed
 *
 * Shows requirements settings
 *
 * www.nodegame.org
 * ---
 */

(function(node) {
  ("use strict");

  node.widgets.register("WaitRoomView", WaitRoomView);

  var JSUS = node.JSUS;

  // ## Meta-data

  WaitRoomView.version = "0.0.1";
  WaitRoomView.description = "Displays a waitroom settings.";

  WaitRoomView.title = "WaitRoom Settings";
  WaitRoomView.className = "waitroomview";

  // ## Dependencies
  WaitRoomView.dependencies = {
    JSUS: {},
    Table: {}
  };

  var originalTable = {};

  function WaitRoomView(options) {
    var that = this;
    this.table = new W.Table({
      className: "table table-striped viewer",
      id: "settingsTable",
      render: {
        pipeline: function(item) {
          //x = 0 y = 0 first row first column
          //x = 0 y = 1 first row second column
          if (originalTable[item.x] === undefined) {
            originalTable[item.x] = {};
          }
          if (item.y % 2 === 0) {
            originalTable[item.x]["content"] = item.content;
            return document.createTextNode(item.content + ": ");
          } else if (item.y % 2 === 1) {
            originalTable[item.x]["value"] = item.content;

            var inp = document.createElement("input");
            inp.placeholder = originalTable[item.x].value;
            inp.disabled = true;
            inp.id = originalTable[item.x].content;
            return inp;
          }
        }
      }
    });
    this.editSaveButton = document.createElement("button");
    this.editSaveButton.className = "btn btn-primary";
    this.editSaveButton.innerHTML = "Edit";

    this.span = document.createElement("span");
    this.span.className = "origContent";
    this.table.setHeader(["Setting", "Value"]);
    // Creates table.table.
    this.table.parse();
  }

  WaitRoomView.prototype.append = function() {
    var that = this;

    this.bodyDiv.appendChild(this.table.table);
    this.span.appendChild(this.editSaveButton);
    this.bodyDiv.appendChild(this.span);
  };

  WaitRoomView.prototype.listeners = function() {
    var that;
    that = this;
    node.on("CHANNEL_SELECTED", function() {
      that.displayData();
    });
  };

  WaitRoomView.prototype.displayData = function() {
    var i, t, s, tmp;
    var that = this;

    // Not ready yet.
    if (!node.game.gamesInfo) return;
    s = node.game.gamesInfo[node.game.channelInUse].waitroom;
    t = this.table;
    t.clear();

    //LEVELS in case later use
    node.game.gamesInfo[node.game.channelInUse].levels;

    //my settings
    var mySettings =
      node.game.gamesInfo[node.game.channelInUse].settings.standard;

    //remove unnecessary settings
    delete mySettings.SESSION_ID;
    delete mySettings.TIMER;
    delete mySettings.treatmentName;
    delete mySettings.name;

    //I dont think deleting them from a copy object affects anything
    delete s.EXECUTION_MODE;
    delete s.CHOSEN_TREATMENT;
    delete s.TEXTS;
    delete s.SOUND;

    var combinedSettings = mergeObjects(s, mySettings);

    console.log("WAITROOM S: " + JSON.stringify(s));
    console.log("MY SETTINGS: " + JSON.stringify(mySettings));
    console.log("COMBINED " + JSON.stringify(combinedSettings));

    this.editSaveButton.onclick = function() {
      var listOfSettings = [
        (repeat = W.gid("REPEAT")),
        (imageDir = W.gid("IMG_DIR")),
        (nOfNeighbors = W.gid("N_OF_NEIGHBORS")),
        (userDataFolder = W.gid("USER_DATA_FOLDER")),
        (botDataFolder = W.gid("BOT_DATA_FOLDER")),
        (maleNamesPath = W.gid("MALE_NAMES_FILE")),
        (femaleNamesPath = W.gid("FEMALE_NAMES_FILE")),
        (group_size = W.gid("GROUP_SIZE")),
        (playWithBots = W.gid("ALLOW_PLAY_WITH_BOTS"))
      ];

      if (that.editSaveButton.innerHTML == "Edit") {
        that.editSaveButton.innerHTML = "Save";
        for (let x = 0; x < listOfSettings.length; x++) {
          var currentSetting = listOfSettings[x];
          var currentContent = originalTable[x + 1].content;
          var originalValue = originalTable[x + 1].value;

          if (
            currentSetting.value === "" ||
            currentSetting.placeholder == originalValue
          ) {
            //do nothing
          } else {
            currentSetting.placeholder = currentSetting.value;

            //update table structure for prev value
            originalTable[x + 1].value = currentSetting.value;
          }

          currentSetting.disabled = false;
        }
      } else if (that.editSaveButton.innerHTML == "Save") {
        that.editSaveButton.innerHTML = "Edit";

        var changes = {};
        changes["s"] = {};
        changes["mySettings"] = {};
        //disable the field
        for (let x = 0; x < listOfSettings.length; x++) {
          var currentSetting = listOfSettings[x];
          var currentContent = originalTable[x + 1].content;
          var originalValue = originalTable[x + 1].value;
          var currentValue = currentSetting.value;

          //not changed
          if (
            currentSetting.value === "" ||
            currentSetting.value == originalValue
          ) {
          } else {
            //SAVE IN A OBJECT AS STATED

            //waitroom s settings
            if (currentContent == "GROUP_SIZE") {
              changes["s"][currentContent] = parseInt(currentValue);
              changes["s"]["POOL_SIZE"] = parseInt(currentValue);
            } else if (currentContent == "ALLOW_PLAY_WITH_BOTS") {
              changes["s"][currentContent] = currentValue == "true";
            } else if (currentContent == "REPEAT") {
              changes["mySettings"][currentContent] = parseInt(currentValue);
            } else if (currentContent == "IMG_DIR") {
              changes["mySettings"][currentContent] = currentValue;
            } else if (currentContent == "N_OF_NEIGHBORS") {
              changes["mySettings"][currentContent] = parseInt(currentValue);
            } else if (currentContent == "MALE_NAMES_FILE") {
              changes["mySettings"][currentContent] = currentValue;
            } else if (currentContent == "FEMALE_NAMES_FILE") {
              changes["mySettings"][currentContent] = currentValue;
            } else if (currentContent == "USER_DATA_FOLDER") {
              changes["mySettings"][currentContent] = currentValue;
            } else if (currentContent == "BOT_DATA_FOLDER") {
              changes["mySettings"][currentContent] = currentValue;
            }
            //mySettings

            //update original table if any of the inputs is not empty
            originalTable[x + 1].value = currentValue;
          }

          currentSetting.disabled = true;
        }

        console.log("CHANGES: " + JSON.stringify(changes));

        //send changes in waitingroom
        if (!isEmptyObject(changes.s)) {
          node.socket.send(
            node.msg.create({
              target: "SERVERCOMMAND",
              text: "UPDATE_SETTINGS",
              data: {
                type: "waitroom", // or requirements or settings, etc.
                update: changes.s
              }
            })
          );
        }

        //send changes in settings
        if (!isEmptyObject(changes.mySettings)) {
          node.socket.send(
            node.msg.create({
              target: "SERVERCOMMAND",
              text: "UPDATE_SETTINGS",
              data: {
                type: "settings", // or requirements or settings, etc.
                update: changes.mySettings
              }
            })
          );
        }

        //send the new data back to server
      }
    };

    for (let setting in mySettings) {
      if (mySettings.hasOwnProperty(setting)) {
        t.addRow([setting, mySettings[setting]]);
      }
    }

    //standard properties
    for (i in s) {
      if (s.hasOwnProperty(i)) {
        t.addRow([i, s[i]]);
      }
    }

    t.parse();
  };

  //check if object is empty or not (utility function)
  function isEmptyObject(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) return false;
    }
    return true;
  }

  function mergeObjects(obj1, obj2) {
    var obj3 = {};
    for (var attrname in obj1) {
      obj3[attrname] = obj1[attrname];
    }
    for (var attrname in obj2) {
      obj3[attrname] = obj2[attrname];
    }
    return obj3;
  }
})(node);
