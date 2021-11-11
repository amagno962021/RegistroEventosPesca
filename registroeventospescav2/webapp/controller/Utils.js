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
        }


    }
});