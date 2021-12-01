sap.ui.define([
	"sap/ui/base/ManagedObject",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
	"sap/ui/integration/library",
    "sap/m/MessageBox",
], function(
	ManagedObject,
    JSONModel,
    MessageToast,
    integrationLibrary,
    MessageBox
) {
	"use strict";

	return ManagedObject.extend("com.tasa.registroeventospescav2.controller.PescaDeclarada", {

        constructor: function(oView,sFragName,o_this) {

            this._oView = oView;
            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.session);
            let flag = oStore.get("flagFragment");
            if(flag){
                this._oControl = sap.ui.xmlfragment(oView.getId(), "com.tasa.registroeventospescav2.fragments."+ sFragName,this);
            }
            this._bInit = false;
            this.ctr = o_this;

        },

        onButtonPress3:function(o_event){
            console.log(o_event);
        },

        getcontrol:function(){
            return this._oControl;
        },

        validarPescaDeclarada: function(verMensajes){
            this.oBundle = this.ctr.getOwnerComponent().getModel("i18n").getResourceBundle();
            var bOk = true;
            var motivo = this.ctr._motivoMarea; //motivo de marea de modelo detalle marea
            var eventoActual = this.ctr._listaEventos[this.ctr._elementAct]; //modelo del evento actual
            var pescaDeclarada = eventoActual.ListaPescaDeclarada;
            for (let index = 0; index < pescaDeclarada.length; index++) {
                const element = pescaDeclarada[index];
                var valorPesca = null;
                var mensaje = "";
                if(motivo == "1" || motivo == "2"){
                    if(motivo === "1"){
                        valorPesca = element.PorcPesca;
                        mensaje = this.oBundle.getText("ALGCANTPESCACERO");
                    }else{
                        valorPesca = element.CNPCM;
                        mensaje = this.oBundle.getText("ALGPORCPESCACERO"); 
                    }

                    if(!valorPesca){
                        bOk = false;
                        if(verMensajes){
                            MessageBox.error(mensaje);
                        }   
                    }

                    if(bOk && motivo == "1"){
                        if(element.ZMODA < 1){
                            bOk = false;
                            if(verMensajes){
                                mensaje = "";//no se encontro en el pool de mensajes ALGVALMODACERO
                                MessageBox.error(mensaje);
                            }
                        }


                    }

                    if(!bOk){
                        break;
                    }
                }
                
            }

            return bOk;
        },

        calcularPescaDeclarada: function(){
            var eventoActual = this.ctr._listaEventos[this.ctr._elementAct]; //modelo del evento actual
            var cantPescaDec = eventoActual.ListaPescaDeclarada.length;
            var cantTotal = eventoActual.CantTotalPescDecla;
            if(cantTotal > 0 && cantPescaDec > 0){
                var pescaDecla = eventoActual.ListaPescaDeclarada;
                for (let index = 0; index < pescaDecla.length; index++) {
                    const element = pescaDecla[index];
                    var porcPesca = element.PorcPesca;
                    element.Editado = true;
                    element.PorcPesca = porcPesca;
                    element.CantPesca = cantTotal * (porcPesca * 0.01);
                    element.CNPCM = element.CantPesca;
                }
            }
            this._oView.getModel("eventos").updateBindings(true);
            //refrescar modelo
        },

        validarPorcPesca: function(){
            var bOk = true;
            this.oBundle = this.ctr.getOwnerComponent().getModel("i18n").getResourceBundle();
            var eventoActual = this.ctr._listaEventos[this.ctr._elementAct]; //modelo del evento actual
            var cantPescaDec = eventoActual.ListaPescaDeclarada.length;
            var cantTotal = eventoActual.CantTotalPescDecla;
            if(cantTotal > 0 && cantPescaDec > 0){
                var pescaDeclarada = eventoActual.ListaPescaDeclarada;
                var porcTotal = 0;
                for (let index = 0; index < pescaDeclarada.length; index++) {
                    const element = pescaDeclarada[index];
                    var porcPesca = element.PorcPesca;
                    porcPesca = porcPesca != null ? porcPesca : 0;
                    porcTotal += porcPesca;
                }

                if(porcTotal < 100){
                    bOk = false;
                    var mssg = this.oBundle.getText("PORCPESCMENOR100");
                    MessageBox.error(mssg);
                }else if(porcTotal > 100){
                    bOk = false;
                    var mssg = this.oBundle.getText("PORCPESCMAYOR100");
                    MessageBox.error(mssg);
                }
            
            }
            return bOk;
        },

        calcularCantTotalPescDeclEve: function(){
            var eventoActual = this.ctr._listaEventos[this.ctr._elementAct]; //modelo del evento actual
            var pescaDeclarada = eventoActual.ListaPescaDeclarada;
            var cantTotal = 0;
            for (let index = 0; index < pescaDeclarada.length; index++) {
                const element = pescaDeclarada[index];
                var cantPesca = element.CantPesca;
                cantPesca = cantPesca != null ? cantPesca : 0;
                cantTotal += cantPesca;
            }
            eventoActual.CantTotalPescDecla = cantTotal;
            //refrescar modelo
        },

        validarCantidadTotalPesca: function(){
            var bOk = true;
            this.oBundle = this.ctr.getOwnerComponent().getModel("i18n").getResourceBundle();
            var detalleMarea = this.ctr._FormMarea;//modelo de detalle de marea
            var indProp =  this.ctr._indicadorProp;//obtener indicador de propeidad del modelo de marea
            var cantTotal = 0;

            if(indProp == "T" && (cantTotal == null || (cantTotal != null))){
                var mssg = this.oBundle.getText("CANTPESCANOCERO");
                MessageBox.error(mssg);
                bOk = false;
            }

            return bOk;
        }


	});
});