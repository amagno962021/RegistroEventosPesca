sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/tasa/registroeventospescav2/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("com.tasa.registroeventospescav2.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			 //Carga Inicial
			 //this.cargaInicial();
		},

		/*cargaInicial: function(){
            //consulta tipo embarcacion
            var currentUser = this.getCurrentUser();
            this.consultaTipoEmbarcacion(currentUser);
            //this.consultaPlantas();
            //this.getCurrentUser();
            //this.cargaMareas();
            
        },

		consultaTipoEmbarcacion: function(user){
            var that = this;
            var oGlobalBusyDialog = new sap.m.BusyDialog();
            var host = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
            var path = "/api/embarcacion/listaTipoEmbarcacion?";
            var query = "usuario=" + user;
            var sUrl = host + path + query;
            $.ajax({
                url: sUrl,
                type: 'GET',
                cache: false,
                async: true,
                dataType: 'json',
                beforeSend: function(){
                    oGlobalBusyDialog.open();
                },
                success: function (data, textStatus, jqXHR) {
                    //that.getModel("TipoEmbarcacion").attachRequestCompleted(function(oEvent) { console.log(oEvent.getSource().getData()); });
                    that.getModel("TipoEmbarcacion").setData(JSON.parse(data));
                    that.getModel("TipoEmbarcacion").refresh();
                    that.consultaPlantas(user);
                    //oGlobalBusyDialog.close();
                },
                complete: function(){
                    oGlobalBusyDialog.close();
                },
                error: function (xhr, readyState) {
                    console.log(xhr);
                }
            });
        },

		consultaPlantas: function(user){
            var that = this;
            //var oGlobalBusyDialog = new sap.m.BusyDialog();
            var host = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
            var path = "/api/embarcacion/listaPlantas?";
            var query = "usuario=" + user;
            var sUrl = host + path + query;
            $.ajax({
                url: sUrl,
                type: 'GET',
                cache: false,
                async: false,
                dataType: 'json',
                beforeSend: function(){
                    //oGlobalBusyDialog.open();
                },
                success: function (data, textStatus, jqXHR) {
                    that.getModel("Plantas").setData(JSON.parse(data));
                    that.getModel("Plantas").refresh();
                    that.cargaMareas(user);
                    //oGlobalBusyDialog.close();
                },
                complete: function(){
                    //oGlobalBusyDialog.close();
                },
                error: function (xhr, readyState) {
                    console.log(xhr);
                }
            });
        },

		cargaMareas: function(usuario){
            var that = this;
            //var oGlobalBusyDialog = new sap.m.BusyDialog();
            var host = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
            var path = "/api/embarcacion/ObtenerFlota?";
            var query = "user=" + usuario;
            var sUrl = host + path + query;
            $.ajax({
                url: sUrl,
                type: 'GET',
                cache: false,
                async: false,
                dataType: 'json',
                beforeSend: function(){
                    //oGlobalBusyDialog.open();
                },
                success: function (data, textStatus, jqXHR) {
                    var sData = JSON.parse(data);
                    console.log(sData);
                    var str_di = sData.str_di;
                    var propios = [];
                    var terceros = [];
                    for (let index = 0; index < str_di.length; index++) {
                        const element = str_di[index];
                        if (element.ESMAR == "A" || element.ESMAR == "C" || element.ESCMA == "P") {
                            if (element.INPRP == "P") {
                                propios.push(element);
                            } else if (element.INPRP == "T") {
                                terceros.push(element);
                            }
                        }
                    }
                    that.getModel("Propios").setData(propios);
                    that.getModel("Terceros").setData(terceros);
                    that.getModel("Propios").refresh();
                    that.getModel("Terceros").refresh();
                    //oGlobalBusyDialog.close();
                },
                complete: function(){
                    //oGlobalBusyDialog.close();
                },
                error: function (xhr, readyState) {
                    console.log(xhr);
                }
            });

        },*/

		getCurrentUser: function(){
            return "fgarcia";
           /* var that = this;
            var oGlobalBusyDialog = new sap.m.BusyDialog();
            var sUrl = "/user-api/currentUser";
            $.ajax({
                url: sUrl,
                type: 'GET',
                cache: false,
                async: false,
                dataType: 'json',
                beforeSend: function(){
                    oGlobalBusyDialog.open();
                },
                success: function (data, textStatus, jqXHR) {
                    that.getModel("CurrentUser").setData(data);
                    that.getModel("CurrentUser").refresh();
                    //oGlobalBusyDialog.close();
                },
                complete: function(){
                    oGlobalBusyDialog.close();
                },
                error: function (xhr, readyState) {
                    console.log(xhr);
                }
            });*/

        }




	});
});
