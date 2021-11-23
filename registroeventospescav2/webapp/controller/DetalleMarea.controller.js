sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../Formatter/formatter",
    "sap/m/MessageBox",
    "../Service/TasaBackendService",
    "sap/ui/core/BusyIndicator",
    "./Utils",
], function (
    Controller,
    JSONModel,
    History,
    formatter,
    MessageBox,
    TasaBackendService,
    BusyIndicator,
    Utils
) {
    "use strict";

    return Controller.extend("com.tasa.registroeventospescav2.controller.DetalleMarea", {

        formatter: formatter,

        onInit: function () {
            this.router = this.getOwnerComponent().getRouter();
            this.router.getRoute("DetalleMarea").attachPatternMatched(this._onPatternMatched, this);
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

        },

        _onPatternMatched: function (oEvent) {
            var modeloMarea = this.getOwnerComponent().getModel("DetalleMarea");


            //validar fechas nulas en tabla de eventos
            this.validaFechaNulaEvt();


            //cargar combos
            this.cargarCombos();

            //obtener datos de distribucion de flota
            this.obtenerDatosDistribFlota();

            //obtener datos de marea anterior
            this.obtenerDatosMareaAnt();

            //validacion de reserva de combustible
            this.validarReservaCombustible();

            //validar limite de veda
            this.validarLimiteVeda();

            //validaciones de oibjetos de vista
            this.validarVista();

        },

        getCurrentUser: function () {
            return "fgarcia";
        },

        onBackListMarea: function () {
            history.go(-1);
        },

        onCrearArmador: function (oEvent) {
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

        onSeleccionarArmador: function (oEvent) {
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

        },

        abrirCrearEvento: function () {
            this.getNuevoEvento().open();

        },

        onEliminarEvento: function (evt) {
            var that = this;
            var tablaEventos = this.getView().byId("tblEventos");
            var selectedItem = tablaEventos.getSelectedItem();
            var modeloDetalleMarea = this.getOwnerComponent().getModel("DetalleMarea");
            var dataDetalleMarea = modeloDetalleMarea.getData();
            var eventos = dataDetalleMarea.Eventos.Lista;
            var motivoMarea = dataDetalleMarea.Cabecera.CDMMA;
            if (selectedItem) {
                var object = selectedItem.getBindingContext("DetalleMarea").getObject();
                if (object.NREVN == eventos.length) {
                    //validar y eliminar evento
                    var inprpEvento = object.INPRP;
                    if (object.CDTEV !== "6") {
                        MessageBox.confirm("Realmente desea eliminar este evento ?", {
                            actions: [MessageBox.Action.OK, MessageBox.Action.CLOSE],
                            onClose: function (sAction) {
                                if (sAction == MessageBox.Action.OK) {
                                    that.eliminarEvento(object);
                                }
                            }
                        });
                    } else {
                        if (motivoMarea == "2" && inprpEvento == "P") {
                            if (!that.verificarCambiosDescarga()) {
                                that.eliminarEvento(object);
                            } else {
                                MessageBox.information(this.oBundle.getText("NOANULDESCARGA"));
                            }
                        } else {
                            that.eliminarEvento(object);
                        }
                    }
                } else {
                    MessageBox.information(this.oBundle.getText("NOELIMEVENTO"));
                }
            } else {
                MessageBox.information(this.oBundle.getText("SELECEVENTOELIM"));
            }
        },

        eliminarEvento: function (object) {
            //la eliminacion lo hace en memoria
            //pero parcialmente elimina el evento de la tabla zflevn

        },

        verificarCambiosDescarga: function () {
            //VALIDAR CON ERICK ESTE METODO POR QUE ES DE EVENTOCUST
            return true;
        },

        anularDescarga: function () {
            //VALIDAR CON ERICK ESTE METODO POR QUE ES DE EVENTOCUST
            return true;
        },

        getNuevoEvento: function () {
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment("com.tasa.registroeventospescav2.view.fragments.NuevoEvento", this);
                this.getView().addDependent(this.oDialog);
            }
            return this.oDialog;
        },

        onCrearEvento: function () {
            this.getNuevoEvento().close();

        },

        onCerrarCrearEvento: function () {
            this.getNuevoEvento().close();

        },

        validaComboTipoEvento: function (sData) {
            var oVal = [];
            var modeloDetalleMarea = this.getOwnerComponent().getModel("DetalleMarea");
            var dataDetalleMarea = modeloDetalleMarea.getData();
            var motivoMarea = dataDetalleMarea.Cabecera.CDMMA;
            var eventos = dataDetalleMarea.Eventos.Lista;
            var motivosSinZarpe = ["3", "7", "8"];
            var motivoEventoHo = ["7", "8"];
            var motivoCalaSDes = ["4", "5", "6"];
            if (motivosSinZarpe.includes(motivoMarea)) {
                if (motivoEventoHo.includes(motivoMarea)) {
                    var existeEveHoro = false;
                    for (let index = 0; index < eventos.length; index++) {
                        const element = eventos[index];
                        if (element.CDTEV == "H" || element.CDTEV == "T") {
                            existeEveHoro = true;
                            //llenamos solo siniestro
                            for (let index = 0; index < sData.length; index++) {
                                const element = sData[index];
                                if (element.id == "8") {
                                    oVal.push(element);
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    if (!existeEveHoro) {
                        for (let index = 0; index < sData.length; index++) {
                            const element = sData[index];
                            if (element.id == "8" || element.id == "H" || element.id == "T") {
                                oVal.push(element);
                            }
                        }
                    }
                } else {
                    for (let index = 0; index < sData.length; index++) {
                        const element = sData[index];
                        if (element.id == "8") {
                            oVal.push(element);
                            break;
                        }
                    }
                }
            } else {
                if (eventos.length > 0) {
                    var ultimoEvento = eventos[eventos.length - 1];
                    var tipoEvento = ultimoEvento.CDTEV;
                    if (tipoEvento == "1" || tipoEvento == "4") {
                        for (let index = 0; index < sData.length; index++) {
                            const element = sData[index];
                            if (element.id == "2" || element.id == "5" || element.id == "8") {
                                oVal.push(element);
                            }
                        }
                    } else if (tipoEvento == "2" || tipoEvento == "3") {
                        for (let index = 0; index < sData.length; index++) {
                            const element = sData[index];
                            if (element.id == "3" || element.id == "4" || element.id == "8") {
                                oVal.push(element);
                            }
                        }
                    } else if (tipoEvento == "5" || tipoEvento == "6") {
                        if (tipoEvento == "5" && ultimoEvento.CDMNP || motivoCalaSDes.includes(motivoMarea)) {
                            for (let index = 0; index < sData.length; index++) {
                                const element = sData[index];
                                if (element.id == "1" || element.id == "7" || element.id == "8") {
                                    oVal.push(element);
                                }
                            }
                        } else {
                            for (let index = 0; index < sData.length; index++) {
                                const element = sData[index];
                                if (element.id == "1" || element.id == "6" || element.id == "7" || element.id == "8") {
                                    oVal.push(element);
                                }
                            }
                        }
                    } else if (tipoEvento == "7" || tipoEvento == "8") {
                        for (let index = 0; index < sData.length; index++) {
                            const element = sData[index];
                            if (element.id == "1" || element.id == "8") {
                                oVal.push(element);
                            }
                        }
                    }
                } else {
                    for (let index = 0; index < sData.length; index++) {
                        const element = sData[index];
                        if (element.id == "8" || element.id == "1") {
                            oVal.push(element);
                        }
                    }
                }
            }
            dataDetalleMarea.Config.datosCombo.TipoEventos = oVal;
            modeloDetalleMarea.refresh();
        },

        validarReservaCombustible: function () {
            var usuario = this.getCurrentUser();
            var modeloDetalleMarea = this.getOwnerComponent().getModel("DetalleMarea");
            var dataDetalleMarea = modeloDetalleMarea.getData();
            var indicadorPro = dataDetalleMarea.Cabecera.INPRP;
            var motivoResCombu = ["1", "2", "4", "5", "6", "7", "8"]; // Motivos de marea que pueden reservar combustible
            var motivo = dataDetalleMarea.Cabecera.CDMMA;
            var numeroMarea = dataDetalleMarea.Cabecera.NRMAR;
            var estMar = dataDetalleMarea.DatosGenerales.ESMAR;
            var eventos = dataDetalleMarea.Eventos.Lista;
            if (eventos) {
                var ultimoEvento = eventos[eventos.length - 1];
                var tipoUltEvento = ultimoEvento.CDTEV;
                if (indicadorPro == "P" && motivoResCombu.includes(motivo)) {
                    TasaBackendService.obtenerNroReserva(numeroMarea, usuario).then(function (response) {
                        dataDetalleMarea.Config.visibleTabReserva = true;
                        var numeroReserva = response.data[0].NRRSV;
                        var mostrarTab = numeroReserva ? true : false;
                        var mareaCerrada = estMar == "C";
                        if (!mareaCerrada) {
                            if (motivo == "3" || motivo == "7" || motivo == "8") {
                                mostrarTab = true;
                            } else {
                                if ((tipoUltEvento == "4" || tipoUltEvento == "5" || tipoUltEvento == "6") && !mostrarTab) {
                                    mostrarTab = true;
                                }

                            }
                        }
                        if (mostrarTab) {
                            if (!mareaCerrada) {


                            } else {

                            }

                        }
                        modeloDetalleMarea.refresh();
                    }).catch(function (error) {
                        console.log("Error: DetalleMarea.validarReservaCombustible - ", error);
                    });
                }
            }


        },

        cargarCombos: async function () {
            var me = this;
            var currentUser = this.getCurrentUser();
            var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
            var dataDetalleMarea = modeloDetalleMarea.getData();

            //combo departamentos
            /*var resDepartamentos = await TasaBackendService.obtenerDepartamentos(currentUser).then(function (response) {
                var departamentos = response.data;
                dataDetalleMarea.Config.datosCombo.Departamentos = departamentos;
                modeloDetalleMarea.refresh();
            }).catch(function (error) {
                console.log("ERROR: DetalleMarea.cargarCombos - ", error);
            });
            if(resDepartamentos){

            }*/

            //combo motivos de marea
            TasaBackendService.obtenerDominio("ZDO_ZCDMMA").then(function (response) {
                var sData = response.data[0].data;
                var inprp = dataDetalleMarea.Cabecera.INPRP;
                var items = [];
                if (inprp == "P") {
                    items = sData
                } else {
                    for (let index = 0; index < sData.length; index++) {
                        const element = sData[index];
                        if (element.id == "1" || element.id == "2") {
                            items.push(element);
                        }
                    }
                }
                dataDetalleMarea.Config.datosCombo.MotivosMarea = items;
                modeloDetalleMarea.refresh();
            }).catch(function (error) {
                console.log("ERROR: DetalleMarea.cargarCombos - ", error);
            });

            //combo ubicacion de pesca
            TasaBackendService.obtenerDominio("ZDO_ZINUBC").then(function (response) {
                var sData = response.data[0].data;
                dataDetalleMarea.Config.datosCombo.UbicPesca = sData;
                modeloDetalleMarea.refresh();
            }).catch(function (error) {
                console.log("ERROR: DetalleMarea.cargarCombos - ", error);
            });

            //combo estado de marea
            TasaBackendService.obtenerDominio("ZDO_ZESMAR").then(function (response) {
                var sData = response.data[0].data;
                dataDetalleMarea.Config.datosCombo.EstMar = sData;
                modeloDetalleMarea.refresh();
            }).catch(function (error) {
                console.log("ERROR: DetalleMarea.cargarCombos - ", error);
            });

            //combo tipo de eventos
            TasaBackendService.obtenerDominio("ZCDTEV").then(function (response) {
                var sData = response.data[0].data;
                me.validaComboTipoEvento(sData);
            }).catch(function (error) {
                console.log("ERROR: DetalleMarea.cargarCombos - ", error);
            });
        },

        validaFechaNulaEvt: function () {
            var me = this;
            var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
            console.log(modeloDetalleMarea);
            var dataDetalleMarea = modeloDetalleMarea.getData();
            var eventos = dataDetalleMarea.Eventos.Lista;
            if (eventos) {
                for (let index = 0; index < eventos.length; index++) {
                    const element = eventos[index];
                    if (element.FIEVN != "null") {
                        element.FECHOINI = element.FIEVN + " " + element.HIEVN;
                    } else {
                        element.FECHOINI = "";
                    }
                    if (element.FFEVN != "null") {
                        element.FECHOFIN = element.FFEVN + " " + element.HFEVN;
                    } else {
                        element.FECHOFIN = "";
                    }
                }
            }
            modeloDetalleMarea.refresh();
        },

        obtenerDatosDistribFlota: function () {
            var me = this;
            var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
            var dataDetalleMarea = modeloDetalleMarea.getData();
            var embarcacion = dataDetalleMarea.Cabecera.CDEMB;
            var currentUser = this.getCurrentUser();
            var distFlota = dataDetalleMarea.DistribFlota;
            TasaBackendService.obtenerDatosDstrFlota(embarcacion, currentUser).then(function (response) {
                for (var keyD in distFlota) {
                    if (response.hasOwnProperty(keyD)) {
                        distFlota[keyD] = response[keyD];
                    }
                }
            }).catch(function (error) {
                console.log("ERROR: DetalleMarea.obtenerDatosDistribFlota - ", error);
            });
        },

        obtenerDatosMareaAnt: function () {
            var me = this;
            var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
            var dataDetalleMarea = modeloDetalleMarea.getData();
            var estMar = dataDetalleMarea.DatosGenerales.ESMAR;
            var currentUser = this.getCurrentUser();
            console.log("Est Mar: " + estMar);
            if (estMar == "A") {
                var embarcacion = dataDetalleMarea.Cabecera.CDEMB;
                var marea = dataDetalleMarea.Cabecera.NRMAR;
                TasaBackendService.obtenerMareaAnterior(marea, embarcacion, currentUser).then(function (response) {
                    //preparar servicio para obtener marea anterior
                }).catch(function (error) {
                    console.log("ERROR: DetalleMarea.obtenerDatosMareaAnt - ", error);
                });
            }
        },

        onValidaMotivo: async function (evt) {
            var oValidatedComboBox = evt.getSource();
            var sSelectedKey = oValidatedComboBox.getSelectedKey();
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var listaMotivos = modelo.getProperty("/Config/datosCombo/MotivosMarea");
            var motivo = listaMotivos.find(obj => obj.id == sSelectedKey);
            modelo.setProperty("/Cabecera/DESC_CDMMA", motivo.descripcion);
            if(sSelectedKey == "1" || sSelectedKey == "2"){
                modelo.setProperty("/Config/visibleFecHoEta", true);
                modelo.setProperty("/Config/visibleUbiPesca", false);
                modelo.setProperty("/Config/visibleFechIni", false);
                modelo.setProperty("/Cabecera/TXTNOTIF", "");
                modelo.setProperty("/Cabecera/TXTNOTIF1", "");
            }else if(sSelectedKey == "3" || sSelectedKey == "7" || sSelectedKey == "8"){
                modelo.setProperty("/Config/visibleFecHoEta", false);
                modelo.setProperty("/Config/visibleUbiPesca", true);
                modelo.setProperty("/Config/visibleFechIni", true);
                modelo.setProperty("/Config/readOnlyFechIni", false);
                modelo.setProperty("/Config/readOnlyEstaMar", true);
                var MareAntNrmar = modelo.getProperty("/MareaAnterior/NRMAR");
                var MareAntDesc = modelo.getProperty("/MareaAnterior/DESC_CDMMA");
                var MareAntEvt = modelo.getProperty("/MareaAnterior/EventoMarAnt/DESC_CDTEV");
                var MareAntFech = modelo.getProperty("/MareaAnterior/FFMAR");
                var MareAntHora = modelo.getProperty("/MareaAnterior/HFMAR");
                var mssg = this.oBundle.getText("NOTIFULTMAREA", [MareAntNrmar, MareAntDesc, MareAntEvt, MareAntFech, MareAntHora]);
                modelo.setProperty("/Cabecera/TXTNOTIF", mssg);
                modelo.setProperty("/DatosGenerales/FIMAR", MareAntFech);
                modelo.setProperty("/DatosGenerales/HIMAR", MareAntHora);
                modelo.setProperty("/Cabecera/TXTNOTIF1", "");
                if(sSelectedKey == "8"){
                    BusyIndicator.show(0);
                    await this.validarFechaVeda();
                    BusyIndicator.hide();
                }
            }else if(sSelectedKey == "4" || sSelectedKey == "5"){
                modelo.setProperty("/Config/visibleUbiPesca", true);
                modelo.setProperty("/Config/visibleFecHoEta", true);
                modelo.setProperty("/Config/visibleEstMarea", true);
                modelo.setProperty("/Config/readOnlyEstaMar", false);
                modelo.setProperty("/Config/visibleFechIni", false);
                modelo.setProperty("/Config/visibleFechFin", false);
                modelo.setProperty("/DatosGenerales/ESMAR", "A");//Seteamos marea abierta
                modelo.setProperty("/Cabecera/TXTNOTIF", "");
                modelo.setProperty("/Cabecera/TXTNOTIF1", "");
            }
            this.validarComboEventos();
        },

        validarComboEventos: async function(){
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var motivo = modelo.getProperty("/DatosGenerales/CDMMA");
            var tmpEventos = [];
            var response = await TasaBackendService.obtenerDominio("ZCDTEV");
            if(response){
                var eventos = response.data[0].data;
                if(eventos){
                    console.log("Eventos: ", eventos);
                    if(motivo == "1" || motivo == "2" || motivo == "4" || motivo == "5" || motivo == "6"){
                        for (let index = 0; index < eventos.length; index++) {
                            const element = eventos[index];
                            if(element.id == "1" || element.id == "8"){
                                tmpEventos.push(element);
                            }
                        }
                    } else if(motivo == "3"){
                        for (let index = 0; index < eventos.length; index++) {
                            const element = eventos[index];
                            if(element.id == "8"){
                                tmpEventos.push(element);
                            }
                        }
                    } else if(motivo == "7" || motivo == "8"){
                        for (let index = 0; index < eventos.length; index++) {
                            const element = eventos[index];
                            if(element.id == "8" || element.id == "H" || element.id == "T"){
                                tmpEventos.push(element);
                            }
                        }
                    }
                }
                modelo.setProperty("/Config/datosCombo/TipoEventos", tmpEventos);
            }
        },

        validarLimiteVeda: function () {
            var me = this;
            var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
            var dataDetalleMarea = modeloDetalleMarea.getData();
            var motMarea = dataDetalleMarea.Cabecera.CDMMA;
            var estMarea = dataDetalleMarea.DatosGenerales.ESMAR;
            if (motMarea == "8" && estMarea == "A") {
                //preparar servicio para validar limite de veda
            }
        },

        validarVista: function () {
            //ocultar link armador
            //ocultar fecha horta eta
            //ocultar fecha inicio fecha fin
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var indProp = modelo.getProperty("/Cabecera/INPRP");
            if (indProp == "P") {
                modelo.setProperty("/Config/visibleLinkCrearArmador", false);
            } else {
                modelo.setProperty("/Config/visibleLinkCrearArmador", true);
            }

            modelo.setProperty("/Config/visibleFecHoEta", false);
            modelo.setProperty("/Config/visibleFechIni", false);
            modelo.setProperty("/Config/visibleFechFin", false);
            modelo.setProperty("/Config/visibleUbiPesca", false);
            modelo.setProperty("/Config/visibleTabReserva", false);
            modelo.setProperty("/Config/visibleTabVenta", false);
            modelo.setProperty("/Config/visibleTabSepComb", false);
        },

        validarTemporadaVeda: async function(){
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var fechaIni = modelo.getProperty("/DatosGenerales/FIMAR");
            var veda = false
            if(fechaIni){
                var usuario = this.getCurrentUser();
                var strFecha = fechaIni.split("/")[2] + fechaIni.split("/")[1] + fechaIni.split("/")[0] + "";
                var response = await TasaBackendService.obtenerTemporadaVeda(strFecha, usuario);
                if(response.data){
                    var latVed = modelo.getProperty("/DistribFlota/IntLatPuerto");
                    var litorales = response.data;
                    for (let index = 0; index < litorales.length; index++) {
                        const element = litorales[index];
                        var latIni = parseInt(element.LTINI.replace('°', '').replace("'", ''));
                        var latFin = parseInt(element.LTFIN.replace('°', '').replace("'", ''));
                        var millas = parseFloat(element.MILLA).toFixed(3);
                        if (latVed >= latIni && latVed <= latFin && millas > 0) {
                            veda = true;
                            break;
                        }
                    }
                }
            }
            return veda;
        },

        validarFechaVeda: async function(){
            var veda = await this.validarTemporadaVeda();
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var fechaIni = modelo.getProperty("/DatosGenerales/FIMAR");
            var puerto = modelo.getProperty("/DistribFlota/CDPTA");
            var descPuerto = modelo.getProperty("/DistribFlota/DESCR");
            if(veda){
                await this.obtenerLimiteVeda();
            } else{
                modelo.setProperty("/DatosGenerales/CDMMA", "");
                modelo.setProperty("/DatosGenerales/FIMAR", "");
                modelo.setProperty("/DatosGenerales/HIMAR", "");
                var strPuerto = puerto + " " + descPuerto;
                var mssg = this.oBundle.getText("NOVEDFECHAPTO", [fechaIni, strPuerto]);
                MessageBox.error(mssg);
            }
            return veda;
        },

        obtenerLimiteVeda: async function(){
            var veda = true;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var fechaIni = modelo.getProperty("/DatosGenerales/FIMAR");
            var dateFechaIni = Utils.strDateToDate(fechaIni);
            var fechaActual = new Date();
            if(fechaActual.getTime() > dateFechaIni.getTime()){
                dateFechaIni.setDate(dateFechaIni.getDate() + 1);
                var strNextDay = Utils.dateToStrDate(dateFechaIni);
                modelo.setProperty("/DatosGenerales/FIMAR", strNextDay);
                veda = await this.validarTemporadaVeda();
                if(!veda){
                    var mssg = this.oBundle.getText("SOLOVEDAHASTA");
                    modelo.setProperty("/Cabecera/TXTNOTIF1", mssg)
                } 
            }
        },

        onSelectTabMarea: function(evt){
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var motivo = modelo.getProperty("/DatosGenerales/CDMMA");
            var ubicPesca = modelo.getProperty("/DatosGenerales/INUBC");
            var key = evt.getParameter("key");
            var previousKey = evt.getParameter("previousKey");
            var iconTabBar = this.getView().byId("itbDetalleMarea");
            if(key == "itfEventos" && previousKey == "itfDatosGenerales"){
                if(!motivo){
                    iconTabBar.setSelectedKey("itfDatosGenerales");
                    var mssg = this.oBundle.getText("MISSMOTMAR");
                    MessageBox.error(mssg);
                }else{
                    if(motivo == "3" || motivo == "7" || motivo == "8"){
                        if(!ubicPesca){
                            iconTabBar.setSelectedKey("itfDatosGenerales");
                            var mssg = this.oBundle.getText("MISSUBICPESCA");
                            MessageBox.error(mssg);
                        }
                    }
                }
            }
        },

        onNavEventos: function (evt) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var object = evt.getSource().getParent().getBindingContext("DetalleMarea").getObject();
            var indexEvento = object.NREVN - 1;
            modelo.setProperty("/Eventos/LeadSelEvento", indexEvento)
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("DetalleEvento");
        }


    });
});