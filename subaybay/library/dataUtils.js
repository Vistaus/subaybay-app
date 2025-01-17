.import "database.js" as Database
.import "functions.js" as Functions

var dataUtils = dataUtils || (function (undefined) {

    return {
        profiles: (function (currentProfile) {

            return {
                currentName: function() {
                    if (mainView.settings && mainView.mainModels && mainView.mainModels.profilesModel && mainView.mainModels.profilesModel.ready) { 
                      return mainView.mainModels.profilesModel.getItem(settings.activeProfile, "profileId").displayName
                    } else {
                        return ""
                    }
                }
                , list: function() {
                    return Database.getProfiles();
                }
                , refresh: function() {
                    mainView.mainModels.profilesModel.refresh();
                }
                , exists: function(displayName) {
                    return Database.checkProfileIfExist(displayName);
                }
                , new: function(displayName) {
                    var newProfileId = Database.newProfile(displayName);
                    this.refresh();
                    return newProfileId;
                }
                , edit: function(profileId, displayName) {
                    Database.editProfile(profileId, displayName);
                    this.refresh();
                }
                , delete: function(profileId) {
                    var result = Database.deleteProfile(profileId);
                    if (result.success) {
                        this.refresh();
                    }
                    return result;
                }
            }
        })()
        , monitoritems: (function () {

            return {
                list: function() {
                    return Database.getMonitorItems();
                }
                , fieldsList: function() {
                    return Database.getItemsFields();
                }
                , dashList: function() {
                    return Database.getDashItems();
                }
            }
        })()
        , values: function (profile) {

            return {
                add: function(entryDate, fieldId, itemId, value) {
                    return Database.addNewValue(entryDate, fieldId, profile, itemId, value);
                }
                , edit: function(entryDate, fieldId, itemId, value, comments) {
                    return Database.updateItemValue(entryDate, fieldId, profile, itemId, value)
                }
                , delete: function(entryDate, itemId) {
                    return Database.deleteValue(profile, entryDate, itemId);
                }
                , addComment: function(entryDate, comments) {
                    return Database.addNewComment(entryDate, profile, comments);
                }
                , editComment: function(entryDate, comments) {
                    return Database.editComment(entryDate, profile, comments);
                }
                , itemValues: function(itemId, scope, dateFrom, dateTo) {
                    return Database.getItemValues(profile, itemId, scope, dateFrom, dateTo)
                }
                , dashList: function() {
                    var current, datesObj, currentItems, currentItem;
                    var currentItemId, prevItemId;
                    var currentIndex;
                    var valueType, scope, dateScope, grouping;
                    var value, title, entryDate;
                    var dateFrom, dateTo, today;
                    var dashItems = monitoritems.dashList();
                    var arrResults = [];
                    var arrValues = [];
                    var arrFieldValues = [];
                    
                    today = Functions.getToday();
                    entryDate = today;

                    for (var i = 0; i < dashItems.length; i++) {
                        current = dashItems[i];
                        currentItemId = current.item_id
                        scope = current.scope
                        valueType = current.value_type
                        
                        switch(true) {
                            case scope.indexOf('daily') > -1:
                                grouping = "day";
                                break;
                            case scope.indexOf('weekly') > -1:
                                grouping = "week";
                                break;
                            case scope.indexOf('monthly') > -1:
                                grouping = "month";
                                break;
                            default:
                                grouping = "none";
                                break;
                        }

                        switch(true) {
                            case scope.indexOf('today') > -1:
                                dateScope = "today";
                                datesObj = Functions.getStartEndDate(today, 'day');
                                dateFrom = datesObj.start;
                                dateTo = datesObj.end;
                                break;
                            case scope.indexOf('week') > -1:
                                dateScope = "thisweek";
                                datesObj = Functions.getStartEndDate(today, 'week');
                                dateFrom = datesObj.start;
                                dateTo = datesObj.end;
                                break;
                            case scope.indexOf('recent') > -1:
                                dateScope = "recent";
                                if (grouping !== "none" && valueType == "average") {
                                    datesObj = Functions.getStartEndDate(today, 'recent exclude');
                                } else {
                                    datesObj = Functions.getStartEndDate(today, 'recent');
                                }

                                dateFrom = datesObj.start;
                                dateTo = datesObj.end;
                                break;
                            case scope.indexOf('all') > -1:
                                dateScope = "all";
                                datesObj = Functions.getStartEndDate(today, 'all');
                                dateFrom = datesObj.start;
                                dateTo = datesObj.end;
                                break;
                            default:
                                dateScope = "today";
                                dateFrom = today;
                                dateTo = dateFrom;
                                break;
                        }
                        
                        switch(valueType) {
                            case 'total':
                                arrValues = this.getTotal(currentItemId, dateFrom, dateTo, grouping);
                                break;
                            case 'average':
                                arrValues = this.getAverage(currentItemId, dateFrom, dateTo, grouping);
                                break;
                            case 'last':
                                arrValues = this.getLast(currentItemId, dateFrom, dateTo, grouping);
                                break;
                            case 'highest':
                                arrValues = this.getHighest(currentItemId, dateFrom, dateTo, grouping);
                                break;
                            default: 
                                arrValues = [];
                                break;
                        }

                        arrFieldValues = [];
                        for (var h = 0; h < arrValues.length; h++) {
                            entryDate = arrValues[h].entry_date;
                            arrFieldValues.push(arrValues[h].value);
                        }

                        if (entryDate && arrFieldValues.length > 0) {
                            value = arrFieldValues.join("/");
                        } else {
                            value = "";
                        }

                        title = this.getValueLabel(valueType, dateScope, grouping, entryDate);
                        currentItem = { title: title, value: value };
                        
                        if (currentItemId !== prevItemId) {
                            current.items = [currentItem];
                            arrResults.push(current);
                        } else {
                            currentIndex = arrResults.length - 1;
                            currentItems = arrResults[currentIndex].items;
                            currentItems.push(currentItem);
                            arrResults[currentIndex].items = currentItems;
                        }
                        
                        prevItemId = currentItemId;
                    }

                    return arrResults;
                }
                , getTotal: function(itemId, dateFrom, dateTo, grouping) {
                    return Database.getTotalFromValues(profile, itemId, dateFrom, dateTo, grouping)
                }
                , getAverage: function(itemId, dateFrom, dateTo, grouping) {
                    return Database.getAverageFromValues(profile, itemId, dateFrom, dateTo, grouping)
                }
                , getLast: function(itemId, dateFrom, dateTo, grouping) {
                    return Database.getLastValue(profile, itemId, dateFrom, dateTo, grouping)
                }
                , getHighest: function(itemId, dateFrom, dateTo, grouping) {
                    return Database.getHighestValue(profile, itemId, dateFrom, dateTo, grouping)
                }
                , getValueLabel: function(valueType, dateScope, grouping, entryDate) {
                    var label = "";

                    switch(valueType) {
                        case "total":
                            if (dateScope == "today") {
                                label = i18n.tr("Today's Total")
                            } else if (dateScope == "thisweek") {
                                label = i18n.tr("This week's Total")
                            } else if (dateScope == "recent") {
                                label = i18n.tr("Recent Total")
                            }
                            break;
                        case "average":
                            if (dateScope == "today") {
                                label = i18n.tr("Today's Average")
                            } else if (dateScope == "thisweek") {
                                label = i18n.tr("This Week's Average")
                            } else if (dateScope == "recent") {
                                if (grouping == "day") {
                                    label = i18n.tr("Recent Daily Average")
                                } else {
                                    label = i18n.tr("Recent Average")
                                }
                            }
                            break;
                        case "last":
                            label = Functions.relativeTime(entryDate)
                            break;
                        case "highest":
                            if (dateScope == "today") {
                                label = i18n.tr("Highest Today")
                            } else if (dateScope == "thisweek") {
                                label = i18n.tr("Highest This Week")
                            } else if (dateScope == "recent") {
                                label = i18n.tr("Highest Recently")
                            }
                            break;
                    }

                    return label;
                }
            }
        }
    }
})();
