sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(
	Controller
) {
	"use strict";

	return Controller.extend("com.tasa.registroeventospescav2.controller.DetalleMareaExt", {

        /**
         * @override
         */
        onInit: function() {
            jQuery.sap.require("jquery.sap.storage");
			this._oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session);
            this.router = this.getOwnerComponent().getRouter();
            this.router.getRoute("DetalleEventoExt").attachPatternMatched(this._onPatternMatched, this);
            /*this.router.navTo("DetalleEventoExt", {
                nrmar: "123456"
            })*/
            console.log("ENTRA");
        },

        _onPatternMatched: function(param){
            console.log("PARAMS: ", param);
        }


	});
});