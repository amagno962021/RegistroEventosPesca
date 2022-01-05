sap.ui.define([
	"sap/ui/base/ManagedObject",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/integration/library",
    "sap/m/MessageBox",
    "../model/textValidaciones",
	"../Service/TasaBackendService"
], function(
	ManagedObject,
	JSONModel,
	MessageToast,
	library,
	MessageBox,
	textValidaciones,
	TasaBackendService
) {
	"use strict";

	return ManagedObject.extend("com.tasa.registroeventospescav2.controller.Horometro", {

		constructor: function (oView, sFragName, o_this) {

            this._oView = oView;
            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.session);
            let flag = oStore.get("flagFragment");
            if(flag){
                this._oControl = sap.ui.xmlfragment(oView.getId(), "com.tasa.registroeventospescav2.fragments."+ sFragName,this);
            }
            this._bInit = false;
            this.ctr = o_this;
            console.log("entrooooo");


        },
        onButtonPress3: function (o_event) {
            console.log(o_event);
        },

        getcontrol: function () {
            return this._oControl;
        },


        validarLecturaHorometros: function () {
            this.oBundle = this.ctr.getOwnerComponent().getModel("i18n").getResourceBundle();
            var bOk = true;
            var horometroActual = this.ctr._listaEventos[this.ctr._elementAct].ListaHorometros;// nodo horometros de evento actual
            for (let index = 0; index < horometroActual.length; index++) {
                const element = horometroActual[index];
                if (element.lectura < 0) {
                    //Mostrar mensajes
                    var mssg = this.oBundle.getText("LECTHOROMAYORCERO", [element.Lectura]);
                    MessageBox.error(mssg)
                    bOk = false;
                }

            }
            return bOk;
        },

        calcularCantTotalBodegaEve: function () {
            var eventoActual = this.ctr._listaEventos[this.ctr._elementAct]; //nodo evento actual
            var bodegas = eventoActual.ListaBodegas; //bodegas
            var cantTotal = 0;
            for (let index = 0; index < bodegas.length; index++) {
                const element = bodegas[index];
                var cantPesca = Number(element.CantPesca);
                if (cantPesca) {
                    cantTotal += cantPesca;
                }
            }
            eventoActual.CantTotalPescDecla = cantTotal;
            this._oView.getModel("eventos").updateBindings(true);
            //refrescar modelo
        },

        mostrarEnlaces: function () {
            var ListaEventos = this.ctr._listaEventos.length;
            var eventoActual = this.ctr._elementAct; //nodo evento actual
            var indEvento = this.ctr._indicador;

            //this.ctr.modeloVisible.Links = true;
            this.ctr.modeloVisible.LinkRemover = false;
            this.ctr.modeloVisible.LinkDescartar = false;

            if (indEvento == "N" && eventoActual == (ListaEventos - 1)) {
                this.ctr.modeloVisible.LinkRemover = true;
            } else {
                this.ctr.modeloVisible.LinkDescartar = true;
            }
            this.ctr.modeloVisibleModel.refresh();
            this._oView.getModel("eventos").updateBindings(true);
            //refresh model
        },

        validarSiniestros: function () {
            var bOk = true;
            var eventoActual = this.ctr._listaEventos[this.ctr._elementAct];
            var numeroSiniestros = eventoActual.ListaSiniestros.length;
            if (numeroSiniestros < 1) {
                bOk = false;
                var mssg = this.oBundle.getText("NOEXISINIESTROS");
                MessageBox.error(mssg)
            }
            return bOk;
        },

        validarMuestra: function () {
            var bOk = true;
            var eventoActual = this.ctr._listaEventos[this.ctr._elementAct];
            var muestra = eventoActual.Muestra;
            if (muestra < 1) {
                var mssg = this.oBundle.getText("MUESDEBMAYORCERO");
                MessageBox.error(mssg);
                bOk = false;
            }
            return bOk;
        },

        onActionVerMotiLimitacion: function () {
            console.log("onActionVerMotiLimitacion");
            var eventoActual = this.ctr._listaEventos[this.ctr._elementAct];
            var estOper = eventoActual.ESOPE;
            var visible = this.ctr.modeloVisible;//nodo visible
            eventoActual.MotiLimitacion = null;
            if (estOper =="L") {
                eventoActual.MotiLimitacion = null;
                visible.MotiLimitacion = true;
            } else {
                visible.MotiLimitacion = false;
            }
            this.ctr.modeloVisibleModel.refresh();
            this._oView.getModel("eventos").updateBindings(true);
            //refresh model
        },

        crearEventoEspera: function () {
            this.getDialogEventoEspera().open();

        },

        getDialogEventoEspera: function () {
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment("com.tasa.registroeventospescav2.fragments.CrearEventoEspera", this);
                this.getView().addDependent(this.oDialog);
            }
            return this.oDialog;
        },

        onActionRemoverEvento: function () {
            var ListaEventos = this.ctr._listaEventos;
            var eventoActual = this.ctr._listaEventos[this.ctr._eventoNuevo];
            var newArray = this.farrayRemove(ListaEventos, eventoActual);
            ListaEventos = newArray;
            let mod = this.ctr.getOwnerComponent().getModel("DetalleMarea");
            mod.setProperty("/Eventos/Lista", ListaEventos);
            //refresh model
            if (ListaEventos.length < 1) {
               
            }
            this.ctr.resetearValidaciones();
            history.go(-1);
        },

        farrayRemove: function (arr, value) {

            return arr.filter(function (ele) {
                return ele != value;
            });
        },

        onActionDescartarCambios: function () {
            //metodo backmanage
            let mod = this.ctr.getOwnerComponent().getModel("DetalleMarea");
            mod.setProperty("/Eventos/Lista", this.ctr._listaEventosBkup);
            this.ctr.resetearValidaciones();
            history.go(-1);
        },


        onActionVerificarAveria: function (horometro) {
            var averiado = horometro.Averiado;
            if (averiado) {
                horometro.Lectura = 0;
                horometro.ReadOnly = true;
            } else {
                horometro.ReadOnly = false;
            }
            //refresh model
        },

        validarHorometrosEvento: async function () {
            this.oBundle = this.ctr.getOwnerComponent().getModel("i18n").getResourceBundle();
            let mod = this.ctr.getOwnerComponent().getModel("DetalleMarea");
            let indicadorSel = this.ctr._elementAct;
            var bOk = true;
            var listaEventos = this.ctr._listaEventos; //modelo de lista de eventos
            var detalleMarea = this.ctr._FormMarea;//cargar modelo detalle marea
            var eventoActual = listaEventos[this.ctr._elementAct];//model ode evento
            var eventoCompar = null;
            var tipoEvento = eventoActual.CDTEV;
            var motivoMarea = detalleMarea.CDMMA;
            var indActual = this.ctr._elementAct;
            var indCompar = -1;
            var visible = this.ctr.modeloVisible;
            var evenLimi = {
                "1": ["5", "6"],
                "5": ["1"],
                "6": ["5", "6"]
            };
            let evenLimites = evenLimi[tipoEvento];
            if(evenLimites ? true : false){
                for (let index = indActual - 1; index >= 0; index--) {
                    eventoCompar = listaEventos[index];
                    if (evenLimites.includes(eventoCompar.CDTEV)) {
                        indCompar = index;
                        this.ctr._elementAct = index;
                        await this.ctr.obtenerDetalleEvento();
                        this.ctr._elementAct = indicadorSel;
                        break;
                    }
                }
            }
            

            if (eventoActual.FIEVN == null || eventoActual.HIEVN == null) {
                bOk = false;
            }

            if (indCompar > -1 && eventoActual.FIEVN != null && eventoCompar.FIEVN != null) {
                var nodoHoroActual = eventoActual.ListaHorometros;
                var nodoHoroCompar = eventoCompar.ListaHorometros;
                var fechIniEveAct = eventoActual.FIEVN; //dd/MM/yyyy
                var horaIniEveAct = eventoActual.HIEVN; // hh:mm formato 24h
                var dateIniEveAct = null;
                if (fechIniEveAct && horaIniEveAct) {
                    var anio = fechIniEveAct.split("/")[2];
                    var mes = Number(fechIniEveAct.split("/")[1]) - 1;
                    var dia = fechIniEveAct.split("/")[0];
                    var hora = horaIniEveAct.split(":")[0];
                    var minutos = horaIniEveAct.split(":")[1];
                    dateIniEveAct = new Date(anio, mes, dia, hora, minutos);
                }
                var fechIniEveComp = eventoCompar.FIEVN; //dd/MM/yyyy
                var horaIniEveComp = eventoCompar.HIEVN; // hh:mm formato 24h
                var dateIniEveComp = null;
                if (fechIniEveComp && horaIniEveComp) {
                    var anio = fechIniEveComp.split("/")[2];
                    var mes = Number(fechIniEveComp.split("/")[1]) - 1;
                    var dia = fechIniEveComp.split("/")[0];
                    var hora = horaIniEveComp.split(":")[0];
                    var minutos = horaIniEveComp.split(":")[1];
                    dateIniEveComp = new Date(anio, mes, dia, hora, minutos);
                }

                var difHoras = null;
                if (dateIniEveAct && dateIniEveComp) {
                    var diff = (dateIniEveAct.getTime() - dateIniEveComp.getTime()) / 1000;
                    diff /= (60 * 60);
                    difHoras = Math.abs(Math.round(diff));
                }

                for (let index = 0; index < nodoHoroActual.length; index++) {
                    const horoActual = nodoHoroActual[index];
                    for (let index1 = 0; index1 < nodoHoroCompar.length; index1++) {
                        const horoCompar = nodoHoroCompar[index1];
                        if (horoActual.TipoHorometro == horoCompar.TipoHorometro) {
                            var valLimHoro0 = difHoras ? difHoras + 5 : 0;
                            if (horoActual.TipoHorometro == "8") {
                                visible.VisibleDescarga = true;
                                valLimHoro0 = detalleMarea.ValMaxFlujPanga;
                            }
                            var valLimHoro = horoCompar.Lectura + valLimHoro0;
                            var bOk1 = true;
                            if (horoActual.Lectura < 0 || horoActual.Lectura > valLimHoro0) {
                                bOk1 = false;
                            }
                            if (!bOk1) {
                                if (horoActual.Lectura < horoCompar.Lectura || horoActual.Lectura > valLimHoro) {
                                    var message = this.oBundle.getText("LECTHORORANGO", [horoActual.DescTipoHorom, valLimHoro0, horoCompar.Lectura, valLimHoro]);
                                    MessageBox.error(message);
                                } else {
                                    bOk1 = true;
                                }
                            }

                            if (bOk) {
                                bOk = bOk1;
                            }
                            break;
                        }
                    }
                }
            } else if ( (await this.obtenerLectUltHoro())) {
                var capaTanBarca = this.getCapaTanEmba(detalleMarea.CDEMB);
                var eventoCLH = mod.getProperty("/MareaCLH/EventoCLH");
                var nodoHoroActual = eventoActual.ListaHorometros;
                var nodoHoroCompar = eventoCLH.HorometrosCLH;
                var fechIniEveAct = eventoActual.FIEVN; //dd/MM/yyyy
                var horaIniEveAct = eventoActual.HIEVN; // hh:mm formato 24h
                var dateIniEveAct = null;
                if (fechIniEveAct && horaIniEveAct) {
                    var anio = fechIniEveAct.split("/")[2];
                    var mes = Number(fechIniEveAct.split("/")[1]) - 1;
                    var dia = fechIniEveAct.split("/")[0];
                    var hora = horaIniEveAct.split(":")[0];
                    var minutos = horaIniEveAct.split(":")[1];
                    dateIniEveAct = new Date(anio, mes, dia, hora, minutos);
                }
                var fechIniEveComp = eventoCLH.FIEVN; //dd/MM/yyyy
                var horaIniEveComp = eventoCLH.HIEVN; // hh:mm formato 24h
                var dateIniEveComp = null;
                if (fechIniEveComp && horaIniEveComp) {
                    var anio = fechIniEveComp.split("/")[2];
                    var mes = Number(fechIniEveComp.split("/")[1]) - 1;
                    var dia = fechIniEveComp.split("/")[0];
                    var hora = horaIniEveComp.split(":")[0];
                    var minutos = horaIniEveComp.split(":")[1];
                    dateIniEveComp = new Date(anio, mes, dia, hora, minutos);
                }

                var difHoras = null;
                if (dateIniEveAct && dateIniEveComp) {
                    var diff = (dateIniEveAct.getTime() - dateIniEveComp.getTime()) / 1000;
                    diff /= (60 * 60);
                    difHoras = Math.abs(Math.round(diff));
                }

                for (let index = 0; index < nodoHoroActual.length; index++) {
                    const horoActual = nodoHoroActual[index];
                    for (let index1 = 0; index1 < nodoHoroCompar.length; index1++) {
                        const horoCompar = nodoHoroCompar[index1];
                        if (horoActual.TipoHorometro == horoCompar.TipoHorometro) {
                            var valLimHoro0 = difHoras + 5;
                            if (horoActual.TipoHorometro == "8") {
                                valLimHoro0 = detalleMarea.ValMaxFlujPanga;
                            }
                            var valLimHoro = horoCompar.Lectura + valLimHoro0;
                            var bOk1 = true;
                            if (horoActual.Lectura < 0 || horoActual.Lectura > valLimHoro0) {
                                bOk1 = false;
                            }
                            var valFlujometroPanga = 0;
                            var capaTanaBarca = 0;
                            var horActual = 0;
                            var horCompar = 0;
                            if (!bOk1) {
                                valFlujometroPanga = horoCompar.Lectura + capaTanBarca;
                                horActual = horoActual.Lectura;
                                capaTanaBarca = capaTanBarca;
                                horCompar = horoCompar.Lectura;
                                if ((horoActual.Lectura < horoCompar.Lectura && (horoActual.TipoHorometro != "8" && motivoMarea == "7")) ||
                                    (horoActual.Lectura < horoCompar.Lectura && (motivoMarea != "7")) ||
                                    (horoActual.Lectura > valLimHoro && (horoActual.TipoHorometro != "8" && motivoMarea == "7")) ||
                                    (horoActual.Lectura > valLimHoro && (motivoMarea != "7"))) {
                                    var message = this.oBundle.getText("LECTHORORANGO", [horoActual.DescTipoHorom, valLimHoro0, horoCompar.Lectura, valLimHoro]);
                                    MessageBox.error(message);
                                }else if((horActual > capaTanaBarca && horActual < horCompar && capaTanaBarca < horCompar) && (horoActual.TipoHorometro == "8" && motivoMarea == "7") ||
                                    (horActual > valFlujometroPanga) && (horoActual.TipoHorometro == "8" && motivoMarea == "7")){
                                    var message = this.oBundle.getText("LECTHORORANGO", [horoActual.DescTipoHorom, capaTanBarca, horoCompar.Lectura, valFlujometroPanga]);
                                    MessageBox.error(message);
                                }
                            }
                            if (bOk) {
                                bOk = bOk1;
                            }
                            break;
                        }
                    }
                }
            }
            return bOk;
        },

        getCapaTanEmba: function (cdemb) {
            var capaTanEmba = null;
            TasaBackendService.obtenerCapaTanBarca(cdemb).then(function(response){
                var capaTan = response.data[0].CDTAN;
                capaTanEmba = Number(capaTan);
            }).catch(function(error){
                console.log("ERROR: Horometro.getCapaTanEmba - ", error );
            });
            return capaTanEmba;
        },

        obtenerLectUltHoro: async function () {
            var modelo = this.ctr.getOwnerComponent().getModel("DetalleMarea");
            var cdemb = modelo.getProperty("/Cabecera/CDEMB");
            var nrmar = modelo.getProperty("/Cabecera/NRMAR");
            //var mareaClh = detalleMarea.MareaCLH;
            var response = await TasaBackendService.consultarHorometro(cdemb, nrmar);
            if(response){
                var nodoMareaRFC = response.t_marea;
                var nodoEnventoRFC = response.t_event;
                var nodoLecHorRFC = response.t_lechor;
                if(nodoMareaRFC.length > 0){
                    modelo.setProperty("/MareaCLH/NRMAR", nodoMareaRFC[0].NRMAR);
                    if(nodoEnventoRFC.length > 0)
                    {
                        modelo.setProperty("/MareaCLH/EventoCLH/HIEVN", nodoEnventoRFC[0].HIEVN);
                        modelo.setProperty("/MareaCLH/EventoCLH/FIEVN", nodoEnventoRFC[0].FIEVN);
                        modelo.setProperty("/MareaCLH/EventoCLH/NREVN", nodoEnventoRFC[0].NREVN);
                        modelo.setProperty("/MareaCLH/EventoCLH/CDTEV", nodoEnventoRFC[0].CDTEV);
                    }
                    
                    var horometros = [];
                    for (let index = 0; index < nodoLecHorRFC.length; index++) {
                        const element = nodoLecHorRFC[index];
                        var obj = {
                            CDTHR: element.CDTHR,
                            LCHOR: element.LCHOR,
                            NORAV: element.NORAV
                        };
                        horometros.push(obj);
                    }
                    modelo.setProperty("/MareaCLH/EventoCLH/HorometrosCLH", horometros);
                    return true;
                }
            }
            return false;
        },

        onCheckBoxSelected: function (oEvent) {//EVENTO DE PRUEBA
            var oSelectedItem2 = this._oView.byId("prue").mAggregations.items;
            for (var i = 0; i < oSelectedItem2.length; i++) {
                //var prop = oSelectedItem2[i].mProperties;
                //prop.selected = false;
                //console.log(prop);
            }
            //this._oView.getModel("eventos").updateBindings(true);

            // var oSelectedItem = this._oView.byId("prue").getItems();
            // for (var i = 0; i < oSelectedItem.length; i++) {
            //     var item1 = oSelectedItem[i].setSelected(false).setEditable(false);
            //     var cells = item1.getCells();
            //     console.log(cells[0].getText());
            //     console.log(cells[1].getValue());
            //     console.log(cells[2].getText());

            // }
        },
        validarLecturaHorom : function(evt){
            let id = evt.getParameter("id");
            let valorhorom =  sap.ui.getCore().byId(id).getValue();
            if(Number.isInteger(valorhorom) || Number(valorhorom) < 0){
                sap.ui.getCore().byId(id).setValueState( sap.ui.core.ValueState.Error);
                sap.ui.getCore().byId(id).setValueStateText("Introduzca un valor entero positivo");
                this.ctr.validacioncampos = false;
                
            }else{
                sap.ui.getCore().byId(id).setValueState( sap.ui.core.ValueState.None);
                this.ctr.validacioncampos = true;
            }
        }


	});
});