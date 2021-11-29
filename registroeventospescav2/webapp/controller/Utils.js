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

        strDateToDate: function(strDate){
            var date = null;
            if(strDate){ // dd/MM/yyyy
                var anio = parseInt(strDate.split("/")[2]);
                var mes = parseInt(strDate.split("/")[1]) - 1;
                var dia = parseInt(strDate.split("/")[0]);
                date = new Date(anio, mes, dia);
            }
            return date;
        },

        strDateHourToDate: function(strDate, strHour){ // dd/MM/yyyy hh:mm
            var date = null;
            if(strDate && strHour){
                var anio = parseInt(strDate.split("/")[2]);
                var mes = parseInt(strDate.split("/")[1]) - 1;
                var dia = parseInt(strDate.split("/")[0]);
                var hour = parseInt(strHour.split(":")[0]);
                var minute = parseInt(strHour.split(":")[1]);
                date = new Date(anio, mes, dia, hour, minute);
            }
            return date;
        },

        dateToStrDate: function(date){
            if(date){
                var dia = date.getDate();
                var mes = date.getMonth() + 1;
                var anio = date.getFullYear();
                var strDia = "";
                if(dia > 0 && dia < 10){
                    strDia = "0" + dia;
                }else{
                    strDia = dia;
                }
                var strMes = "";
                if(mes > 0 && mes < 10){
                    strMes = "0" + mes;
                }else{
                    strMes = mes;
                }
                return strDia + "/" + strMes + "/" + anio;
            }else{
                return null;
            }
        },

        strDateToSapDate: function(date){
            var newDate = "";
            if(date){
                var dateSplit = date.split("/");
                var dia = dateSplit[0];
                var mes = dateSplit[1];
                var anio = dateSplit[2];
                newDate = dia + mes + anio + "";
            }
            return newDate;
        },

        strHourToSapHo: function(hour){
            var newHour = "";
            if(hour){
                var dateSplit = hour.split(":");
                var hora = dateSplit[0];
                var minuto = dateSplit[1];
                newHour = hora + minuto + "";
            }
            return newHour;
        },

        getEtiqueta: function(path){
            var etiqueta = "";
            if(etiqueta == "/DatosGenerales/CDEMB"){
                etiqueta = "Embarcación";
            }
            if(etiqueta == "/DatosGenerales/CDEMP"){
                etiqueta = "Armador Comercial";
            }

            return etiqueta;
        }


    }
});