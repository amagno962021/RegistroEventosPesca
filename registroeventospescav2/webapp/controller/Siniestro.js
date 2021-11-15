sap.ui.define([
	"sap/ui/base/ManagedObject",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
	"sap/ui/integration/library"
], function(
	ManagedObject,
    JSONModel,
    MessageToast,
    integrationLibrary
) {
	"use strict";

	return ManagedObject.extend("com.tasa.registroeventospescav2.controller.Siniestro", {

        constructor: function(oView,sFragName,o_this) {

            this._oView = oView;
            this._oControl = sap.ui.xmlfragment(oView.getId(), "com.tasa.registroeventospescav2.fragments."+ sFragName,this);
            this._bInit = false;
            this.ctr = o_this;

        },
        onButtonPress3:function(o_event){
            console.log(o_event);
        },

        getcontrol:function(){
            return this._oControl;
        },

        validarSiniestros: function(){
            var bOk = true;
            this.oBundle = this.ctr.getOwnerComponent().getModel("i18n").getResourceBundle();
            var eventoActual = this.ctr._listaEventos[this.ctr._elementAct]; //nodo evento actual
            var siniestros = eventoActual.ListaSiniestros;
            if(siniestros.length < 1){
                var mssg = this.oBundle.getText("NOEXISINIESTROS");
                MessageBox.error(mssg);
                bOk = false;
            }
            return bOk;
        }

	});
});