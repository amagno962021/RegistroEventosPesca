sap.ui.define([
    "./UtilService"
], function(
) {
	"use strict";

    return {

        getHostService: function(){
            return "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
        },

        getBodyDetalleMarea: function(){
            var sBody = {
                fieldEvento: [
                ],
                fieldFLBSP: [
                ],
                fieldMarea: [
                ],
                fieldPSCINC: [
                ],
                p_embarcacion: "",
                p_flag: "",
                p_marea: "",
                user: ""
            };
            return sBody;
        },

        getBodyDominio: function(){
            var sBody = {
                dominios: [
                    {
                        domname: "",
                        status: "A"
                    }
                ]
            };
            return sBody;
        },

        getBodyReadTable: function(){
            var sBody = {
                delimitador: "",
                fields: [],
                no_data: "",
                option: [
                    {
                        wa: ""
                    }
                ],
                options: [
                    {
                        cantidad: "",
                        control: "",
                        key: "",
                        valueHigh: "",
                        valueLow: ""
                    }
                ],
                order: "",
                p_user: "",
                rowcount: 0,
                rowskips: 0,
                tabla: ""
            };
            return sBody;
        },

        getBodyValidaCert: function(){
            var sBody = {
                codEmba: "",
                codPlanta: ""
            };
            return sBody;
        },

        getValidaMarea: function(){
            var sBody = {
                p_codemb: "",
                p_codpta: ""
            };
            return sBody;
        },

        getBodyConHorom: function(){
            var sBody = {
                ip_cdemb: "",
                ip_nrmar: ""
            };
            return sBody;
        },

        getHorometro: function(){
            var sBody = {
                centro: "",
                evento: "",
                marea: "",
                nroEvento: ""
            };
            return sBody;
        },

        getElimPescaDesc: function(){
            var sBody = {
                i_table: "",
                p_user: "",
                t_data: ""
            };
            return sBody;
        },
        getActuaPescaDesc: function(){
            var sBody = {
                p_user: "",
                str_set: []
            };
            return sBody;
        },
        getAnularDescRFC: function(){
            var sBody = {
                p_nrdes: ""
            };
            return sBody;
        },

        getBodyConHorom: function(){
            var sBody = {
                ip_cdemb: "",
                ip_nrmar: ""
            };
            return sBody;
        },

        getConsultaGeneral: function(){
            var sBody = {
                nombreConsulta: "",
                p_user: "",
                parametro1: "",
                parametro2: "",
                parametro3: "",
                parametro4: "",
                parametro5: ""
            };
            return sBody;
        },

        getConsultaMareaBio: function(){
            var sBody = {
                "fieldEvento": [
    
                ],
                "fieldFLBSP": [
                  
                ],
                "fieldMarea": [
                  
                ],
                "fieldPSCINC": [
                  
                ],
                p_flag: "",
                user: "",
                p_marea: "",
                p_embarcacion: ""
            };
            return sBody;
        }

    }

});