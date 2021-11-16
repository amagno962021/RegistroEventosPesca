sap.ui.define([
	"./Utils"
], function(
) {
	"use strict";

	return {

        formatDate: function (date) {
            var d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + (d.getDate() + 1),
                year = d.getFullYear();

            if (month.length < 2)
                month = '0' + month;
            if (day.length < 2)
                day = '0' + day;

            return [day, month, year].join('/');
        },

        removeDuplicateArray: function(data, key){
            return [
                ...new Map(
                    data.map(x => [key(x), x])
                ).values()
            ];
        },

        getDegrees :function(value){
            if (value != "") {
                let type = null;
                value = value.trim();		
                type = this.getFormatGeo(value);
                if (type != null) {
                    return Number(value.substring(0, 3));
                }
            }
            return 0;
        },

        getMinutes :function(value){
            if (value != "") {
                let type = null;
                value = value.trim();		
                type = this.getFormatGeo(value);
                if (type != null) {
                    if (type == "D") {
                        return Number(value.substring(3));
                    } else if (type == "G") {
                        return Number(value.substring(4, 7));
                    }
                } 
            }
            return 0;
        },
        
        getFormatGeo :function(value){
            if (value != "") {
                let myPattern = /(\d){5}/;
                let myGeoPattern =/(\d){3}º(\d){2}'/;
                value = value.trim();
                let myMatcher = myPattern.test(value);
                let myGeoMatcher = myGeoPattern.test(value);
                if (myMatcher) {
                    return "D";
                } else if (myGeoMatcher) {
                    return "G";
                }
            }
            return null;
        },


    }
});