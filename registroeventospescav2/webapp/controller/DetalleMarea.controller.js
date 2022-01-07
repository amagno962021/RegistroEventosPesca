sap.ui.define([
    "./MainComp.controller",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "../Service/TasaBackendService",
    "sap/ui/core/BusyIndicator",
    "./Utils",
    'sap/m/MessageItem',
    'sap/m/MessagePopover'
], function (
    MainComp,
    Controller,
    JSONModel,
    History,
    MessageBox,
    TasaBackendService,
    BusyIndicator,
    Utils,
    MessageItem,
    MessagePopover
) {
    "use strict";

    var oMessagePopover;

    return MainComp.extend("com.tasa.registroeventospescav2.controller.DetalleMarea", {

        onInit: function () {
            this.router = this.getOwnerComponent().getRouter();
            this.router.getRoute("DetalleMarea").attachPatternMatched(this._onPatternMatched, this);
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            //this.oControllerEvento = sap.ui.controller("com.tasa.registroeventospescav2.controller.DetalleEvento"); 
            this.cargarMessagePopover();

        },

        _onPatternMatched: async function (oEvent) {
            console.log("PARAM ROUTER: ", oEvent);
            var modeloMarea = this.getOwnerComponent().getModel("DetalleMarea");
            var indicador = modeloMarea.getProperty("/Cabecera/INDICADOR");

            //validar fechas nulas en tabla de eventos
            this.validaFechaNulaEvt();


            //cargar combos
            this.cargarCombos();

            //obtener datos de distribucion de flota
            //this.obtenerDatosDistribFlota();

            //obtener datos de marea anterior
            //this.obtenerDatosMareaAnt();

            //validacion de reserva de combustible
            //this.validarReservaCombustible();

            //validar limite de veda
            //this.validarLimiteVeda();

            //validaciones de objetos de vista
            await this.validarVista();



        },

        cargarMessagePopover: function () {
            var oMessageTemplate = new MessageItem({
                type: '{DetalleMarea>type}',
                title: '{DetalleMarea>title}',
                activeTitle: "{DetalleMarea>active}",
                description: '{DetalleMarea>description}',
                subtitle: '{DetalleMarea>subtitle}',
                counter: '{DetalleMarea>counter}'
            });

            oMessagePopover = new MessagePopover({
                items: {
                    path: 'DetalleMarea>/Utils/MessageItemsDM',
                    template: oMessageTemplate
                }
            });
            this.byId("messagePopoverBtn").addDependent(oMessagePopover);
        },

        handleMessagePopoverPress: function (oEvent) {
            oMessagePopover.toggle(oEvent.getSource());
        },

        getCurrentUser: function () {
            return "FGARCIA";
        },

        onBackListMarea: function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            //modelo.setProperty("/Utils/MessageItemsDM", []);
            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.Session);
            var initData = oStore.get('InitData');
            modelo.setData(initData);
            history.go(-1);
        },

        onCrearArmador: function (oEvent) {
            var modeloDetalleMarea = this.getOwnerComponent().getModel("DetalleMarea");
            modeloDetalleMarea.setProperty("/Cabecera/NUEVOARM", "X");
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
            modeloDetalleMarea.setProperty("/Cabecera/NUEVOARM", "");
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
                var intNrevn = !isNaN(object.NREVN) ? parseInt(object.NREVN) : 0;
                if (intNrevn == eventos.length) {
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
                                MessageBox.confirm("Realmente desea eliminar este evento ?", {
                                    actions: [MessageBox.Action.OK, MessageBox.Action.CLOSE],
                                    onClose: function (sAction) {
                                        if (sAction == MessageBox.Action.OK) {
                                            that.eliminarEvento(object);
                                        }
                                    }
                                });
                            } else {
                                MessageBox.information(this.oBundle.getText("NOANULDESCARGA"));
                            }
                        } else {
                            MessageBox.confirm("Realmente desea eliminar este evento ?", {
                                actions: [MessageBox.Action.OK, MessageBox.Action.CLOSE],
                                onClose: function (sAction) {
                                    if (sAction == MessageBox.Action.OK) {
                                        that.eliminarEvento(object);
                                    }
                                }
                            });
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
            let mod = this.getOwnerComponent().getModel("DetalleMarea");
            mod.setProperty("/Utils/TipoConsulta", "C");
            mod.setProperty("/Utils/DescTipoEvento", sap.ui.getCore().byId("ne_tipoEvn").getSelectedItem().getText());
            //mod.setProperty("/Utils/TipoEvento","6");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("DetalleEvento");
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
            var primerItem = oVal[0];
            modeloDetalleMarea.setProperty("/Utils/TipoEvento", primerItem.id);
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
            var resDepartamentos = await TasaBackendService.obtenerDepartamentos(currentUser);
            if (resDepartamentos) {
                var departamentos = resDepartamentos.data;
                modeloDetalleMarea.setProperty("/Config/datosCombo/Departamentos", departamentos);
                //dataDetalleMarea.Config.datosCombo.Departamentos = departamentos;
            }

            //combo motivos de marea
            TasaBackendService.obtenerDominio("ZCDMMA").then(function (response) {
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
                    if (element.FIEVN) {
                        element.FECHOINI = element.FIEVN + " " + element.HIEVN;
                    } else {
                        element.FECHOINI = "";
                    }
                    if (element.FFEVN) {
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
            var motivo = oValidatedComboBox.getSelectedKey();
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var listaMotivos = modelo.getProperty("/Config/datosCombo/MotivosMarea");
            var objMotivo = listaMotivos.find(obj => obj.id == motivo);
            modelo.setProperty("/Cabecera/DESC_CDMMA", objMotivo.descripcion);
            this.validarMotivo(motivo);
            this.validarComboEventos();
        },

        validarMotivo: async function (motivo) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var indicador = modelo.getProperty("/Cabecera/INDICADOR");
            if (motivo == "1" || motivo == "2") {
                modelo.setProperty("/Config/visibleFecHoEta", true);
                modelo.setProperty("/Config/visibleUbiPesca", false);
                modelo.setProperty("/Config/visibleFechIni", false);
                modelo.setProperty("/Config/visibleFechFin", false);
                modelo.setProperty("/Cabecera/TXTNOTIF", "");
                modelo.setProperty("/Cabecera/TXTNOTIF1", "");
                if (indicador == "N") {
                    modelo.setProperty("/Config/readOnlyEstaMar", false); //si es nueva marea
                    modelo.setProperty("/Config/visibleBtnGuardar", false); //si es nueva marea
                    modelo.setProperty("/Config/visibleBtnSiguiente", true); //si es nueva marea
                    modelo.setProperty("/DatosGenerales/FEARR", "");
                    modelo.setProperty("/DatosGenerales/HEARR", "");
                    modelo.setProperty("/DatosGenerales/ESMAR", "A");
                }
            } else if (motivo == "3" || motivo == "7" || motivo == "8") {
                modelo.setProperty("/Config/visibleFecHoEta", false);
                modelo.setProperty("/Config/visibleUbiPesca", true);
                modelo.setProperty("/Config/visibleFechIni", true);
                modelo.setProperty("/Config/readOnlyFechIni", false);
                modelo.setProperty("/Config/readOnlyEstaMar", true);
                modelo.setProperty("/DatosGenerales/INUBC", "1");
                if (indicador == "N") {
                    modelo.setProperty("/Config/visibleBtnGuardar", true); //si es nueva marea
                    modelo.setProperty("/Config/visibleBtnSiguiente", false); //si es nueva marea
                    modelo.setProperty("/DatosGenerales/ESMAR", "A");
                }
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
                if (motivo == "8") {
                    BusyIndicator.show(0);
                    await this.validarFechaVeda();
                    BusyIndicator.hide();
                }
            } else if (motivo == "4" || motivo == "5") {
                modelo.setProperty("/Config/visibleUbiPesca", true);
                modelo.setProperty("/Config/visibleFecHoEta", true);
                modelo.setProperty("/Config/visibleEstMarea", true);
                modelo.setProperty("/Config/readOnlyEstaMar", false);
                modelo.setProperty("/Config/visibleFechIni", false);
                modelo.setProperty("/Config/visibleFechFin", false);
                modelo.setProperty("/DatosGenerales/ESMAR", "A");//Seteamos marea abierta
                modelo.setProperty("/Cabecera/TXTNOTIF", "");
                modelo.setProperty("/Cabecera/TXTNOTIF1", "");
                modelo.setProperty("/Config/visibleBtnGuardar", false); //si es nueva marea
                modelo.setProperty("/Config/visibleBtnSiguiente", true); //si es nueva marea
                modelo.setProperty("/DatosGenerales/ESMAR", "A");
            }
        },

        validarComboEventos: async function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var motivo = modelo.getProperty("/DatosGenerales/CDMMA");
            var tmpEventos = [];
            var response = await TasaBackendService.obtenerDominio("ZCDTEV");
            if (response) {
                var eventos = response.data[0].data;
                if (eventos) {
                    //console.log("Eventos: ", eventos);
                    if (motivo == "1" || motivo == "2" || motivo == "4" || motivo == "5" || motivo == "6") {
                        for (let index = 0; index < eventos.length; index++) {
                            const element = eventos[index];
                            if (element.id == "1" || element.id == "8") {
                                tmpEventos.push(element);
                            }
                        }
                    } else if (motivo == "3") {
                        for (let index = 0; index < eventos.length; index++) {
                            const element = eventos[index];
                            if (element.id == "8") {
                                tmpEventos.push(element);
                            }
                        }
                    } else if (motivo == "7" || motivo == "8") {
                        for (let index = 0; index < eventos.length; index++) {
                            const element = eventos[index];
                            if (element.id == "8" || element.id == "H" || element.id == "T") {
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

        validarVista: async function () {
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

            modelo.setProperty("/Utils/MessageItemsDM", []);
            modelo.setProperty("/Config/visibleFecHoEta", false);
            modelo.setProperty("/Config/visibleFechIni", false);
            modelo.setProperty("/Config/visibleFechFin", false);
            modelo.setProperty("/Config/visibleUbiPesca", false);
            //modelo.setProperty("/Config/visibleTabReserva", false);
            //modelo.setProperty("/Config/visibleTabVenta", false);
            modelo.setProperty("/Config/visibleTabSepComb", false);
            modelo.setProperty("/Config/visibleBtnGuardar", false);
            modelo.setProperty("/Config/visibleBtnSiguiente", false);
            var indicador = modelo.getProperty("/Cabecera/INDICADOR");
            if (indicador == "N") {
                modelo.setProperty("/Config/readOnlyMotMarea", true);
                modelo.setProperty("/Config/visibleTabReserva", false);
                modelo.setProperty("/Config/visibleTabSepComb", false);
                modelo.setProperty("/Config/visibleTabVenta", false);
                modelo.setProperty("/Config/visibleBtnGuardar", true);
                modelo.setProperty("/Config/visibleBtnSiguiente", false);
            } else {
                var motivoMarea = modelo.getProperty("/Cabecera/CDMMA");
                this.validarMotivo(motivoMarea);
                modelo.setProperty("/Config/visibleBtnGuardar", true);
                modelo.setProperty("/Config/readOnlyMotMarea", false);
                await this.validaDescargas();
            }

        },

        validarTemporadaVeda: async function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var fechaIni = modelo.getProperty("/DatosGenerales/FIMAR");
            var veda = false;
            if (fechaIni) {
                var usuario = this.getCurrentUser();
                var strFecha = fechaIni.split("/")[2] + fechaIni.split("/")[1] + fechaIni.split("/")[0] + "";
                var response = await TasaBackendService.obtenerTemporadaVeda(strFecha, usuario);
                if (response.data) {
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

        validarFechaVeda: async function () {
            var veda = await this.validarTemporadaVeda();
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var fechaIni = modelo.getProperty("/DatosGenerales/FIMAR");
            var puerto = modelo.getProperty("/DistribFlota/CDPTA");
            var descPuerto = modelo.getProperty("/DistribFlota/DESCR");
            if (veda) {
                await this.obtenerLimiteVeda();
            } else {
                modelo.setProperty("/DatosGenerales/CDMMA", "");
                modelo.setProperty("/DatosGenerales/FIMAR", "");
                modelo.setProperty("/DatosGenerales/HIMAR", "");
                var strPuerto = puerto + " " + descPuerto;
                var mssg = this.oBundle.getText("NOVEDFECHAPTO", [fechaIni, strPuerto]);
                MessageBox.error(mssg);
            }
            return veda;
        },

        obtenerLimiteVeda: async function () {
            var veda = true;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var fechaIni = modelo.getProperty("/DatosGenerales/FIMAR");
            var dateFechaIni = Utils.strDateToDate(fechaIni);
            var fechaActual = new Date();
            if (fechaActual.getTime() > dateFechaIni.getTime()) {
                dateFechaIni.setDate(dateFechaIni.getDate() + 1);
                var strNextDay = Utils.dateToStrDate(dateFechaIni);
                modelo.setProperty("/DatosGenerales/FIMAR", strNextDay);
                modelo.setProperty("/Cabecera/VEDAVERIF", dateFechaIni);
                veda = await this.validarTemporadaVeda();
                if (!veda) {
                    modelo.setProperty("/Cabecera/FECVEDMAX", oValue)
                    var mssg = this.oBundle.getText("SOLOVEDAHASTA");
                    modelo.setProperty("/Cabecera/TXTNOTIF1", mssg)
                }
            }
        },

        onSelectTabMarea: function (evt) {
            var key = evt.getParameter("key");
            var previousKey = evt.getParameter("previousKey");
            var iconTabBar = this.getView().byId("itbDetalleMarea");
            if (key == "itfEventos" && previousKey == "itfDatosGenerales") {
                var valMotUbicPesca = this.validarMotivoUbiPesca();
                if (!valMotUbicPesca) {
                    iconTabBar.setSelectedKey("itfDatosGenerales");
                }
            }
        },

        validarMotivoUbiPesca: function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var motivo = modelo.getProperty("/DatosGenerales/CDMMA");
            var ubicPesca = modelo.getProperty("/DatosGenerales/INUBC");
            var bOk = true;
            if (!motivo) {
                modelo.setProperty("/Utils/MessageItemsDM", []);
                bOk = false;
                //iconTabBar.setSelectedKey("itfDatosGenerales");
                var mssg = this.oBundle.getText("MISSMOTMAR");
                //MessageBox.error(mssg);
                var objMessage = {
                    type: 'Error',
                    title: 'Mensaje de Error',
                    activeTitle: false,
                    description: mssg,
                    subtitle: mssg,
                    counter: 1
                };
                var messageItems = modelo.getProperty("/Utils/MessageItemsDM");
                messageItems.push(objMessage);
                modelo.refresh();

                var oButton = this.getView().byId("messagePopoverBtn");
                oMessagePopover.getBinding("items").attachChange(function (oEvent) {
                    oMessagePopover.navigateBack();
                    oButton.setType(this.buttonTypeFormatter("DM"));
                    oButton.setIcon(this.buttonIconFormatter("DM"));
                    oButton.setText(this.highestSeverityMessages("DM"));
                }.bind(this));

                setTimeout(function () {
                    oMessagePopover.openBy(oButton);
                    oButton.setType(this.buttonTypeFormatter("DM"));
                    oButton.setIcon(this.buttonIconFormatter("DM"));
                    oButton.setText(this.highestSeverityMessages("DM"));
                }.bind(this), 100);

            } else {
                if (motivo == "3" || motivo == "7" || motivo == "8") {
                    if (!ubicPesca) {
                        bOk = false;
                        //iconTabBar.setSelectedKey("itfDatosGenerales");
                        var mssg = this.oBundle.getText("MISSUBICPESCA");
                        MessageBox.error(mssg);
                    }
                }
            }
            return bOk;
        },

        onNavEventos: function (evt) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var object = evt.getSource().getParent().getBindingContext("DetalleMarea").getObject();
            var indexEvento = object.NREVN - 1;
            modelo.setProperty("/Utils/TipoConsulta", "E");
            modelo.setProperty("/Eventos/LeadSelEvento", indexEvento);
            modelo.setProperty("/Utils/DescTipoEvento", object.DESC_CDTEV);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("DetalleEvento");
        },

        onSave: async function () {           
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var validarMareaEventos = sap.ui.controller("com.tasa.registroeventospescav2.controller.DetalleEvento").validarMareaEventos(this);
            var tieneErrores = modelo.getProperty("/Cabecera/TERRORES");
            if (validarMareaEventos) {
                if (!tieneErrores) {
                    modelo.setProperty("/Utils/VisibleObsvComb", false);
                    await this.validarDatosMarea();
                    this.prepararVistaConfirm();
                    this.getConfirmDialog().open();
                }
            }
            //this.getConfirmSaveDialogTest().open();
        },

        onCloseConfirm: async function () {
            await this.SaveGeneral();
            // var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            // var visbleObsComb = modelo.getProperty("/Utils/VisibleObsvComb");
            // var obsComb = modelo.getProperty("/Cabecera/OBSCOMB");
            // if(visbleObsComb && !obsComb){
            //     var mssg = this.oBundle.getText("MISSOBSCOMB");;
            //     MessageBox.error(mssg);
            // }else{
            //     await this.guardarCambios();
            // }
        },

        getConfirmDialog: function () {
            if (!this.oDialogConfirm) {
                this.oDialogConfirm = sap.ui.xmlfragment("com.tasa.registroeventospescav2.view.fragments.Confirm", this);
                this.getView().addDependent(this.oDialogConfirm);
            }
            return this.oDialogConfirm;
        },

        onCancelConfirm: function () {
            this.getConfirmDialog().close();
        },

        validarDatosMarea: async function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var motivo = modelo.getProperty("/Cabecera/CDMMA");
            var estado = modelo.getProperty("/DatosGenerales/ESMAR");
            var esNuevo = modelo.getProperty("/Cabecera/INDICADOR") == "N" ? true : false;
            var motivoSinZarpe = ["3", "7", "8"];
            var campos = [];
            if (esNuevo) {
                campos = ["/DatosGenerales/CDEMB", "/DatosGenerales/CDMMA", "/DatosGenerales/INUBC"];
                if (!motivoSinZarpe.includes(motivo)) {
                    var nuevoArmadorFlag = modelo.getProperty("/Cabecera/NUEVOARM");
                    if (nuevoArmadorFlag == "X") {
                        campos = ["/DatosGenerales/NuevoArmador/RUC", "/DatosGenerales/NuevoArmador/RAZON", "/DatosGenerales/NuevoArmador/CALLE", "/DatosGenerales/NuevoArmador/DISTRITO",
                            "/DatosGenerales/NuevoArmador/PROVINCIA", "/DatosGenerales/NuevoArmador/DEPARTAMENTO", "/DatosGenerales/CDEMB", "/DatosGenerales/CDMMA"];
                    } else {
                        campos = ["/DatosGenerales/CDEMB", "/DatosGenerales/CDEMP", "/DatosGenerales/CDMMA"];
                    }
                } else {
                    campos = ["/DatosGenerales/FIMAR"];
                    if (estado == "C") {
                        campos = ["/DatosGenerales/FIMAR", "/DatosGenerales/FFMAR"];
                    }
                }
            } else {
                if (motivoSinZarpe.includes(motivo) && estado == "C") {
                    campos = ["/DatosGenerales/HIMAR", "/DatosGenerales/FFMAR"]
                }
            }
            this.validateFormFields(campos);
            await this.validarFechaIniFin();
        },

        validarFechaIniFin: async function () {
            var vFin = false;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var motivo = modelo.getProperty("/Cabecera/CDMMA");
            var estado = modelo.getProperty("/DatosGenerales/ESMAR");
            var esNuevo = modelo.getProperty("/Cabecera/INDICADOR") == "N" ? true : false;
            var motivoSinZarpe = ["3", "7", "8"];
            var fechHorIni = null;
            var fechHorActual = new Date();
            if (esNuevo) {
                if (motivoSinZarpe.includes(motivo)) {
                    var fechaIni = modelo.getProperty("/DatosGenerales/FIMAR");
                    var horaIni = modelo.getProperty("/DatosGenerales/HIMAR");
                    fechHorIni = Utils.strDateHourToDate(fechaIni, horaIni);
                    if (estado == "C") {
                        vFin = true;
                    }
                    if (fechHorIni.getTime() < fechHorActual.getTime()) {
                        vFin = false;
                        var mssg = this.oBundle.getText("FECINIMARMENOFECHACT");
                        MessageBox.error(mssg);
                    }
                    if (vFin && motivo == "8") {
                        await this.validarFechaVeda();
                    }
                }
            } else {
                if (motivoSinZarpe.includes(motivo) && estado == "C") {
                    vFin = true;
                }
            }

            if (vFin) {
                var fechaFin = modelo.getProperty("/DatosGenerales/FFMAR");
                var horaFin = modelo.getProperty("/DatosGenerales/HFMAR");
                var fechHorFin = Utils.strDateHourToDate(fechaFin, horaFin);
                if (fechaFin.getTime() > fechHorActual.getTime()) {
                    vFin = false;
                    var mssg = this.oBundle.getText("FECFINMARMENOFECHACT");
                    MessageBox.error(mssg);
                } else if (!motivoSinZarpe.includes(motivo) && fechHorFin.getTime() < fechHorIni.getTime()) {
                    vFin = false;
                    var mssg = this.oBundle.getText("FECINIMARMENFECFINMAR");
                    MessageBox.error(mssg);
                } else if (motivoSinZarpe.includes(motivo)) {
                    if (fechHorFin.getTime() < fechHorIni.getTime()) {
                        var mssg = this.oBundle.getText("FECFINMARNOMENFECINIMAR");
                        MessageBox.error(mssg);
                    }
                }
            }
        },

        validateFormFields: function (campos) {
            var bOk = true;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            for (let index = 0; index < campos.length; index++) {
                const path = campos[index];
                var value = modelo.getProperty(path);
                if (!value) {
                    bOk = false;
                    var etiqueta = Utils.getEtiqueta(path);
                    var mssg = this.oBundle.getText("MISSFORMFIELD", [etiqueta]);
                    MessageBox.error(mssg);
                    break;
                }
            }
            return bOk;
        },

        prepararVistaConfirm: function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            modelo.setProperty("/Utils/VisibleEstCierre", false);
            var texto = this.oBundle.getText("CONFIRMSAVEMESSAGE");
            modelo.setProperty("/Utils/TextoConfirmacion", texto);
            this.verificarCierreMarea();
        },

        verificarCierreMarea: function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var eventos = modelo.getProperty("/Eventos/Lista");
            var estadoMarea = modelo.getProperty("/DatosGenerales/ESMAR");
            var ultimoEvento = eventos[eventos.length - 1];
            var cantTotalDeclMarea = sap.ui.controller("com.tasa.registroeventospescav2.controller.DetalleEvento").obtenerCantTotalPescaDecla(0, this);
            var cantTotalDeclDescMarea = sap.ui.controller("com.tasa.registroeventospescav2.controller.DetalleEvento").obtenerCantTotalPescaDeclDesc(0, this);
            var motivoMarea = modelo.getProperty("/Cabecera/CDMMA");
            var motivoMarPesca = ["1", "2"];
            var motivoCalaSDes = ["4", "5", "6"];
            if (ultimoEvento) {
                var tipoEvento = ultimoEvento.CDTEV;
                var verEstCierre = false;
                if (tipoEvento == "8") {
                    verEstCierre = true;
                } else if (motivoMarPesca.includes(motivoMarea)) {
                    if ((tipoEvento == "5" || tipoEvento == "6") && cantTotalDeclMarea == cantTotalDeclDescMarea) {
                        verEstCierre = true;

                    } else if (estadoMarea == "C" && tipoEvento == "5" && cantTotalDeclMarea > 0 && cantTotalDeclDescMarea > 0) {
                        verEstCierre = true;
                        var mssg = this.oBundle.getText("CERRPDECMAYPDESC");
                        MessageBox.warning(mssg);
                        var texto = mssg + " " + this.oBundle.getText("CONFIRMSAVEMESSAGE");
                        modelo.setProperty("/Utils/TextoConfirmacion", texto);
                    }
                } else if (motivoCalaSDes.includes(motivoMarea) && tipoEvento == "5") {

                }
                if (verEstCierre) {
                    modelo.setProperty("/Utils/VisibleEstCierre", true);
                }
                return verEstCierre;
            }
            return false;
        },

        onPressNuevoSuministro: function () {
            this.getNuevaMareaDialog().open();
        },

        onCancelNuevaMarea: function () {
            this.getNuevaMareaDialog().close();
        },

        onProcesarSum: async function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var inprp = modelo.getProperty("/Cabecera/INPRP");

            if (inprp == "P") {
                await this.onReservar()
            }

            if (inprp == "T") {
                await this.onVender();
            }
        },

        onReservar: async function () {
            BusyIndicator.show(0);
            var validar = await this.validarCabeceraSuministro();
            if (validar) {
                var mssg = this.oBundle.getText("CONFIRMSAVEMESSAGE");
                var me = this;
                MessageBox.confirm(mssg, {
                    title: me.oBundle.getText("CONFIRMSAVETITLE"),
                    onClose: function (evt) {
                        if (evt == "OK") {
                            BusyIndicator.hide();
                            me.getNuevaMareaDialog().close();
                            me.SaveReserva()
                        }
                    }
                })
            } else {
                BusyIndicator.hide();
            }
        },

        onVender: async function () {
            BusyIndicator.show(0);
            var validar = await this.validarCabeceraSuministro();
            if (validar) {
                var mssg = this.oBundle.getText("CONFIRMSAVEMESSAGE");
                var me = this;
                MessageBox.confirm(mssg, {
                    title: me.oBundle.getText("CONFIRMSAVETITLE"),
                    onClose: function (evt) {
                        if (evt == "OK") {
                            BusyIndicator.hide();
                            me.getNuevaMareaDialog().close();
                            me.SaveVentaComb()
                        }
                    }
                })
            } else {
                BusyIndicator.hide();
            }
        },

        SaveReserva: async function () {
            BusyIndicator.show(0);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var val = await this.crearReserva();
            if (val) {
                var me = this;
                var nroReserva = modelo.getProperty("/Result/NroReserva");
                var mssg = this.oBundle.getText("NRORESERVAGEN", [nroReserva]);
                MessageBox.success(mssg, {
                    title: "Exito",
                    onClose: async function () {
                        BusyIndicator.hide();
                        await me.obtenerReservas(true);
                    }
                });
            } else {
                BusyIndicator.hide();
            }
        },

        SaveVentaComb: async function () {
            BusyIndicator.show(0);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var val = await this.crearVentaComb();
            if (val) {
                var me = this;
                var nroPedido = modelo.getProperty("/Result/NroPedido");
                var mssg = this.oBundle.getText("NROPEDIDOGEN", [nroPedido]);
                MessageBox.success(mssg, {
                    title: "Exito",
                    onClose: async function () {
                        BusyIndicator.hide();
                        await me.obtenerVentas(true);
                    }
                });
            } else {
                BusyIndicator.hide();
            }
        },

        validarCabeceraSuministro: async function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var campos = ["/Cabecera/CDEMB", "/Suministro/0/CNSUM"];
            var bOk = this.validateFormFields(campos);
            if (bOk) {
                var cantSuministro = modelo.getProperty("/Suministro/0/CNSUM");
                if (!isNaN(cantSuministro)) {
                    if (Number(cantSuministro) > 0) {
                        var capTanque = modelo.getProperty("/EmbaComb/CDTAN");
                        var stockComb = modelo.getProperty("/EmbaComb/STCMB");
                        var cantCombTotal = 0;
                        var cantSumProp = 0;
                        if (!isNaN(stockComb) && !isNaN(capTanque)) {
                            cantCombTotal = Number(cantSuministro) + Number(stockComb);
                            cantSumProp = Number(capTanque) - Number(stockComb);
                        }
                        if (cantCombTotal > capTanque) {
                            bOk = false;
                            var mssg = this.oBundle.getText("CAPTANQUESUP", [cantSumProp]);
                            MessageBox.error(mssg);
                        }
                    } else {
                        bOk = false;
                        var mssg = this.oBundle.getText("CANTSUMNOCERO");
                        MessageBox.error(mssg);
                    }
                } else {
                    bOk = false;
                    var mssg = this.oBundle.getText("CANTSUMNOINT");
                    MessageBox.error(mssg);
                }
            }
            return bOk;
        },

        getNuevaMareaDialog: function () {
            if (!this.oDialogNuevoSum) {
                this.oDialogNuevoSum = sap.ui.xmlfragment("com.tasa.registroeventospescav2.view.fragments.NuevoSuministro", this);
                this.getView().addDependent(this.oDialogNuevoSum);
            }
            return this.oDialogNuevoSum;
        },

        onSelectAlmacen: function (evt) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var descAlmacen = evt.getParameter("value");
            modelo.setProperty("/Suministro/0/DSALM", descAlmacen);
        },

        onAnularReservas: async function () {
            BusyIndicator.show(0);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var reservasCombustible = modelo.getProperty("/ReservasCombustible");
            var listReservas = [];
            var indiReservas = [];
            for (let index = 0; index < reservasCombustible.length; index++) {
                const element = reservasCombustible[index];
                if (element.CHKDE) {
                    var obj = {
                        NRRSV: element.NRRSV,
                        NRMAR: element.NRMAR
                    };
                    listReservas.push(obj);
                    indiReservas.push(index);
                }
            }
            if (listReservas.length > 0) {
                var me = this;
                var mssg = this.oBundle.getText("ANULARESERMES");
                var title = this.oBundle.getText("ANULARESERTITLE");
                MessageBox.confirm(mssg, {
                    title: title,
                    onClose: async function (evt) {
                        if (evt == "OK") {
                            BusyIndicator.hide();
                            await me.anularReservas(listReservas, indiReservas);
                        }
                    }
                })
            } else {
                BusyIndicator.hide();
                var mssg = this.oBundle.getText("NORESERVASSELEC");
                MessageBox.error(mssg);
            }
        },

        getReviewDialog: function () {
            if (!this.oDialogReview) {
                this.oDialogReview = sap.ui.xmlfragment("com.tasa.registroeventospescav2.view.fragments.ReviewReserva", this);
                this.getView().addDependent(this.oDialogReview);
            }
            return this.oDialogReview;
        },

        onAbrirDetalleSuministro: async function (evt) {
            var reserva = evt.getSource().getParent().getBindingContext("DetalleMarea").getObject();
            if (reserva.NRMAR && reserva.NRRSV) {
                var nrmar = reserva.NRMAR;
                //var nrrsv = reserva.NRRSV;
                var nrrsv = "0023985052";//para pruebas
                var abrirPopup = await this.obtenerDetalleSuministro(nrmar, nrrsv);
                if (abrirPopup) {
                    this.getReviewDialog().open();
                }
            } else {
                MessageBox.error("ERROR: No se obtuvo datos");
            }
        },

        onCloseReviewRes: function () {
            this.getReviewDialog().close();
        },

        onAnulaVentaComb: function () {
            BusyIndicator.show(0);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var ventasCombustible = modelo.getProperty("/VentasCombustible");
            var listVentas = [];
            var indiVentas = [];
            for (let index = 0; index < ventasCombustible.length; index++) {
                const element = ventasCombustible[index];
                if (element.CHKDE) {
                    var obj = {
                        p_vbeln: element.NRRSV,
                        p_nrmar: element.NRMAR,
                        p_user: this.getCurrentUser()
                    };
                    listVentas.push(obj);
                    indiVentas.push(index);
                }
            }
            if (listVentas.length > 0) {
                var me = this;
                var mssg = this.oBundle.getText("ANULARESERMES");
                var title = this.oBundle.getText("ANULARPEDIDOTITLE");
                MessageBox.confirm(mssg, {
                    title: title,
                    onClose: async function (evt) {
                        if (evt == "OK") {
                            BusyIndicator.hide();
                            await me.anularVentas(listVentas, indiVentas);
                        }
                    }
                });
            } else {
                BusyIndicator.hide();
                var mssg = this.oBundle.getText("NOPEDIDOSELEC");
                MessageBox.error(mssg);
            }
        },

        onNuevaVentaComb: function () {

        },

        validaDescargas: async function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var listaEventos = modelo.getProperty("/Eventos/Lista");
            var motivoMarea = modelo.getProperty("/Cabecera/CDMMA");
            var estadoMarea = modelo.getProperty("/DatosGenerales/ESMAR");
            for (let index = 0; index < listaEventos.length; index++) {
                const element = listaEventos[index];
                if (element.CDTEV == "6") {
                    if (estadoMarea == "A" && motivoMarea == "2" && element.INPRP == "P" && element.NRDES) {
                        await this.verificarErroresMarea(element.NRDES);
                        break;
                    }
                }
            }
        },

        verificarErroresMarea: async function (nroDescarga) {
            await this.validarErroresDescargaMarea(nroDescarga);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var messageItems = modelo.getProperty("/Utils/MessageItemsDM");
            if (messageItems.length > 0) {
                var oButton = this.getView().byId("messagePopoverBtn");
                oMessagePopover.getBinding("items").attachChange(function (oEvent) {
                    oMessagePopover.navigateBack();
                    oButton.setType(this.buttonTypeFormatter("DM"));
                    oButton.setIcon(this.buttonIconFormatter("DM"));
                    oButton.setText(this.highestSeverityMessages("DM"));
                }.bind(this));

                setTimeout(function () {
                    oMessagePopover.openBy(oButton);
                    oButton.setType(this.buttonTypeFormatter("DM"));
                    oButton.setIcon(this.buttonIconFormatter("DM"));
                    oButton.setText(this.highestSeverityMessages("DM"));
                }.bind(this), 100);
                modelo.setProperty("/Config/visibleDetalleEvento", false);
            } else {
                modelo.setProperty("/Config/visibleDetalleEvento", true);
            }
        },

        onNuevaReserva: async function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var inprp = modelo.getProperty("/Cabecera/INPRP");
            if (inprp == "P") {
                modelo.setProperty("/Config/TxtNuevaVentaRes", "Nueva Reserva");
            }
            if (inprp == "T") {
                modelo.setProperty("/Config/TxtNuevaVentaRes", "Nueva Venta");
            }

            await this.obtenerNuevoSuministro(false);
            this.getNuevaResVenDialog().open();
        },


        getNuevaResVenDialog: function () {
            if (!this.oDialogNuevaResVent) {
                this.oDialogNuevaResVent = sap.ui.xmlfragment("com.tasa.registroeventospescav2.view.fragments.NuevaReservaVenta", this);
                this.getView().addDependent(this.oDialogNuevaResVent);
            }
            return this.oDialogNuevaResVent;
        },

        onCancelNuevaResVent: function () {
            this.getNuevaResVenDialog().close();
        },

        onNext: function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var valMotUbicPesca = this.validarMotivoUbiPesca();
            if (valMotUbicPesca) {
                modelo.setProperty("/Utils/TipoConsulta", "C");
                modelo.setProperty("/Utils/TipoEvento", "1");
                modelo.setProperty("/Utils/DescTipoEvento", "Zarpe");
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("DetalleEvento");
                this.getNuevoEvento().close();
            }
        },

        onMostrarFechaFin: function(){
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var motivoMarea = modelo.getProperty("/DatosGenerales/CDMMA");
            var estadoMarea = modelo.getProperty("/DatosGenerales/ESMAR");
            var motivoSinZarpe = ["3", "7", "8"];
            var cerrar = true;
            if(motivoSinZarpe.includes(motivoMarea)){
                modelo.setProperty("/DatosGenerales/FEARR", "");
                modelo.setProperty("/DatosGenerales/HEARR", "");
                var visibleFecHorFin = modelo.getProperty("/Config/visibleFechFin");
                if(visibleFecHorFin == false){
                    modelo.setProperty("/DatosGenerales/FFMAR", "");
                    modelo.setProperty("/DatosGenerales/HFMAR", "");
                }
                if(estadoMarea == "C"){
                    modelo.setProperty("/Config/visibleFechFin", true);
                }else{
                    modelo.setProperty("/Config/visibleFechFin", false);
                }
            }else{
                modelo.setProperty("/DatosGenerales/FIMAR", "");
                modelo.setProperty("/DatosGenerales/HIMAR", "");
                modelo.setProperty("/DatosGenerales/FFMAR", "");
                modelo.setProperty("/DatosGenerales/HFMAR", "");
                modelo.setProperty("/Config/visibleFechFin", false);
                if(estadoMarea == "C"){
                    cerrar = this.verificarCierreMarea();
                }
            }

            if(!cerrar){
                var mssg = this.oBundle.getText("EVENTOSNOCOMPLE");
                MessageBox.error(mssg);
                modelo.setProperty("/DatosGenerales/ESMAR", "A")
            }

        },

        onCallUsuario: function () {

            /*var sUrl = "https://current-user-qas.cfapps.us10.hana.ondemand.com/getuserinfo";
            $.ajax({
                type: "GET",
                url: sUrl,
                async: true,
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                error: function (err) {
                    console.log("ERROR USER INFO: ", err);
                },
                success: function (data, textStatus, jqXHR) {
                    console.log("USER INFO: ", data);
                }

            });*/

        },

        getConfirmSaveDialogTest: function () {
            if (!this.oDialogConfirmSave) {
                this.oDialogConfirmSave = sap.ui.xmlfragment("com.tasa.registroeventospescav2.view.fragments.EventoFinalizado", this);
                this.getView().addDependent(this.oDialogConfirmSave);
            }
            return this.oDialogConfirmSave;
        },


    });
});