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
            var eventoActual = {}; //nodo evento actual
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
                var cantPesca = element.CantPesca;
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

            if (indEvento == "N" && eventoActual == ListaEventos[ListaEventos - 1]) {
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
            var numeroSiniestros = eventoActual.Siniestros.length;
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
            //refresh model
            if (ListaEventos.length < 1) {
                history.go(-1);
            }
        },

        farrayRemove: function (arr, value) {

            return arr.filter(function (ele) {
                return ele != value;
            });
        },

        onActionDescartarCambios: function () {
            //metodo backmanage
            this.ctr._listaEventos = this.ctr._listaEventosBkup;
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

        validarHorometrosEvento: function () {
            this.oBundle = this.ctr.getOwnerComponent().getModel("i18n").getResourceBundle();
            var bOk = true;
            var listaEventos = this.ctr._listaEventos; //modelo de lista de eventos
            var detalleMarea = this.ctr._FormMarea;//cargar modelo detalle marea
            var eventoActual = listaEventos[this.ctr._elementAct];//model ode evento
            var eventoCompar = null;
            var tipoEvento = eventoActual.TipoEvento;
            var motivoMarea = detalleMarea.MotMar;
            var indActual = eventoActual.Posicion;
            var indCompar = -1;
            var visible = {};
            var evenLimi = {
                "1": ["5", "6"],
                "5": ["1"],
                "6": ["5", "6"]
            };
            var evenLimites = evenLimi[tipoEvento];
            for (let index = indActual - 1; index >= 0; index--) {
                const element = array[index];
                eventoCompar = listaEventos[index];
                if (evenLimites.includes(eventoCompar.TipoEvento)) {
                    indCompar = index;
                    this.ctr.obtenerDetalleEvento();
                    break;
                }
            }

            if (eventoActual.FechIni == null || eventoActual.HoraIni == null) {
                bOk = false;
            }

            var capaTanBarca = this.getCapaTanEmba(detalleMarea.Embarcacion);
            var LectUltHoro = this.obtenerLectUltHoro();
            if (indCompar > -1 && eventoActual.FechIni != null && eventoCompar.FechIni != null) {
                var nodoHoroActual = eventoActual.ListaHorometros;
                var nodoHoroCompar = eventoCompar.ListaHorometros;
                var fechIniEveAct = eventoActual.FechIni; //dd/MM/yyyy
                var horaIniEveAct = eventoActual.HoraIni; // hh:mm formato 24h
                var dateIniEveAct = null;
                if (fechIniEveAct && horaIniEveAct) {
                    var anio = fechIniEveAct.split("/")[2];
                    var mes = Number(fechIniEveAct.split("/")[1]) - 1;
                    var dia = fechIniEveAct.split("/")[0];
                    var hora = horaIniEveAct.split(":")[0];
                    var minutos = horaIniEveAct.split(":")[1];
                    dateIniEveAct = new Date(anio, mes, dia, hora, minutos);
                }
                var fechIniEveComp = eventoCompar.FechIni; //dd/MM/yyyy
                var horaIniEveComp = eventoCompar.HoraIni; // hh:mm formato 24h
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
            } else if (LectUltHoro) {
                var eventoCLH = detalleMarea.EventoCLH;
                var nodoHoroActual = eventoActual.ListaHorometros;
                var nodoHoroCompar = eventoCLH.HorometrosCLH;
                var fechIniEveAct = eventoActual.FechIni; //dd/MM/yyyy
                var horaIniEveAct = eventoActual.HoraIni; // hh:mm formato 24h
                var dateIniEveAct = null;
                if (fechIniEveAct && horaIniEveAct) {
                    var anio = fechIniEveAct.split("/")[2];
                    var mes = Number(fechIniEveAct.split("/")[1]) - 1;
                    var dia = fechIniEveAct.split("/")[0];
                    var hora = horaIniEveAct.split(":")[0];
                    var minutos = horaIniEveAct.split(":")[1];
                    dateIniEveAct = new Date(anio, mes, dia, hora, minutos);
                }
                var fechIniEveComp = eventoCompar.FechIni; //dd/MM/yyyy
                var horaIniEveComp = eventoCompar.HoraIni; // hh:mm formato 24h
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

        obtenerLectUltHoro: function () {
            var detalleMarea = {};
            var cdemb = detalleMarea.Embarcacion;
            var nrmar = detalleMarea.Marea;
            var mareaClh = detalleMarea.MareaCLH;
            TasaBackendService.consultarHorometro(cdemb, nrmar).then(function(response){
                var nodoMareaRFC = response.t_marea;
                var nodoEnventoRFC = response.t_event;
                var nodoLecHorRFC = response.t_lechor;
                var nodoHoroCLH = mareaClh.EventoCLH.HorometrosCLH;
                if(nodoMareaRFC.length > 0){
                    mareaClh.Marea = nodoMareaRFC[0].NRMAR;
                    mareaClh.EventoCLH.Numero = nodoEnventoRFC[0].NREVN;
                    mareaClh.EventoCLH.TipoEvento = nodoEnventoRFC[0].CDTEV;
                    mareaClh.EventoCLH.FechIni = nodoEnventoRFC[0].FIEVN;
                    mareaClh.EventoCLH.HoraIni = nodoEnventoRFC[0].HIEVN;
                    for (let index = 0; index < nodoLecHorRFC.length; index++) {
                        const element = nodoLecHorRFC[index];
                        var obj = {
                            TipoHorometro: element.CDTHR,
                            Lectura: element.LCHOR,
                            Averiado: element.NORAV
                        };
                        nodoHoroCLH.push(obj);
                    }
                    //REFRESCAR MODELO PRINCIPAL DE ALEJANDRO
                    //refrescar modelo mareaClh
                }
            }).catch(function(error){
                console.log("ERROR: Horometro.obtenerLectUltHoro - ", error );
                return false;
            });
            return true;
        },

        onCheckBoxSelected: function (oEvent) {//EVENTO DE PRUEBA
            var oSelectedItem2 = this._oView.byId("prue").mAggregations.items;
            for (var i = 0; i < oSelectedItem2.length; i++) {
                var prop = oSelectedItem2[i].mProperties;
                prop.selected = false;
                console.log(prop);
            }
            this._oView.getModel("eventos").updateBindings(true);

            var oSelectedItem = this._oView.byId("prue").getItems();
            for (var i = 0; i < oSelectedItem.length; i++) {
                var item1 = oSelectedItem[i].setSelected(false).setEditable(false);
                var cells = item1.getCells();
                console.log(cells[0].getText());
                console.log(cells[1].getValue());
                console.log(cells[2].getText());

            }
        }


	});
});