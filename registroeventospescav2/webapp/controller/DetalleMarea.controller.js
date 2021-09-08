sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History"
], function(
	Controller,
    JSONModel,
    MessageBox,
    History,
) {
	"use strict";

	return Controller.extend("com.tasa.registroeventospescav2.controller.DetalleMarea", {

        onInit: function () {
            this.router = this.getOwnerComponent().getRouter(this);
            this.router.getRoute("DetalleMarea").attachPatternMatched(this._onPatternMatched, this);

        },

        _onPatternMatched: function (oEvent) {
            var modeloMarea =  this.getOwnerComponent().getModel("DetalleMarea");
            console.log("modelo marea: ", modeloMarea.getData());
            
        },

        getCurrentUser: function(){ 
            return "fgarcia";
        },

        onBackListMarea: function(){
            history.go(-1);
        },

		onCrearArmador: function(oEvent) {
            var modeloDetalleMarea = this.getOwnerComponent().getModel("DetalleMarea");
            var dataDetalleMarea = modeloDetalleMarea.getData();
            dataDetalleMarea.Config.visibleArmadorComercial = false;
            dataDetalleMarea.Config.visibleLinkCrearArmador = false;
            dataDetalleMarea.Config.visibleArmadorRuc = true;
            dataDetalleMarea.Config.visibleArmadorRazon = true;
            dataDetalleMarea.Config.visibleArmadorCalle = true;
            dataDetalleMarea.Config.visibleArmadorDistrito = true;
            dataDetalleMarea.Config.visibleArmadorProvincia = true;
            dataDetalleMarea.Config.visibleArmadorDepartamento = true;
            dataDetalleMarea.Config.visibleLinkSelecArmador = true;
            modeloDetalleMarea.refresh();
		},

		onSeleccionarArmador: function(oEvent) {
			var modeloDetalleMarea = this.getOwnerComponent().getModel("DetalleMarea");
            var dataDetalleMarea = modeloDetalleMarea.getData();
            dataDetalleMarea.Config.visibleArmadorComercial = true;
            dataDetalleMarea.Config.visibleLinkCrearArmador = true;
            dataDetalleMarea.Config.visibleArmadorRuc = false;
            dataDetalleMarea.Config.visibleArmadorRazon = false;
            dataDetalleMarea.Config.visibleArmadorCalle = false;
            dataDetalleMarea.Config.visibleArmadorDistrito = false;
            dataDetalleMarea.Config.visibleArmadorProvincia = false;
            dataDetalleMarea.Config.visibleArmadorDepartamento = false;
            dataDetalleMarea.Config.visibleLinkSelecArmador = false;
            dataDetalleMarea.DatosGenerales.NuevoArmador.RUC = "";
            dataDetalleMarea.DatosGenerales.NuevoArmador.RAZON = "";
            dataDetalleMarea.DatosGenerales.NuevoArmador.CALLE = "";
            dataDetalleMarea.DatosGenerales.NuevoArmador.DISTRITO = "";
            dataDetalleMarea.DatosGenerales.NuevoArmador.PROVINCIA = "";
            dataDetalleMarea.DatosGenerales.NuevoArmador.DEPARTAMENTO = "";
            modeloDetalleMarea.refresh();
		
		}

	});
});