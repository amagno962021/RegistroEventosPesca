sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "./Utils",
    "../Service/TasaBackendService",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator"
], function (Controller, Utils, TasaBackendService, MessageBox, BusyIndicator) {
    "use strict";

    return Controller.extend("com.tasa.registroeventospescav2.controller.MainComp", {

        existeHormAveriados: false,
        horometrosAveriados: {},

        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            return sap.ui.getCore().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Metodo para inicializar variables
         */
        wdDoInit: function () {
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        getCurrentUser: async function () {
            /*const oUserInfo = await this.getUserInfoService();
            const sUserEmail = oUserInfo.getEmail(); //fgarcia@tasa.com.pe
            var usuario = sUserEmail.split("@")[0].toUpperCase();
            return usuario;*/
            return "FGARCIA";
        },

        getUserInfoService: function () {
            return new Promise(resolve => sap.ui.require([
                "sap/ushell/library"
            ], oSapUshellLib => {
                const oContainer = oSapUshellLib.Container;
                const pService = oContainer.getServiceAsync("UserInfo"); // .getService is deprecated!
                resolve(pService);
            }));
        },

        guardarCambios: async function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var motivoMarea = modelo.getProperty("/DatosGenerales/CDMMA");
            var estadoMarea = modelo.getProperty("/DatosGenerales/ESMAR");
            var indPropiedad = modelo.getProperty("/Cabecera/INPRP");
            var mareaReabierta = false;
            var eventos = modelo.getProperty("/Eventos/Lista");
            var eventoIni = null;
            var eventoFin = null;
            var tipoEventoIni = null;
            var tipoEventoFin = null;
            var motivoSinZarpe = ["3", "7", "8"];
            if (motivoSinZarpe.includes(motivoMarea)) {
                var plantaDistrFlota = modelo.getProperty("/DistribFlota/CDPTA");
                modelo.setProperty("/DatosGenerales/CDPTA", plantaDistrFlota);
            } else {
                eventoIni = eventos[0];
                eventoFin = eventos[eventos.length - 1];
                tipoEventoIni = eventoIni.CDTEV;
                tipoEventoFin = eventoFin.CDTEV;
                modelo.setProperty("/DatosGenerales/CDPTA", eventoFin.CDPTA);
                modelo.setProperty("/DatosGenerales/FIMAR", eventoIni.FIEVN);
                modelo.setProperty("/DatosGenerales/HIMAR", eventoIni.HIEVN);
            }

            if (estadoMarea == "C") {
                if (!mareaReabierta) {
                    modelo.setProperty("/Cabecera/ESCMA", "T");
                }
                if (!motivoSinZarpe.includes(motivoMarea)) {
                    var fechaActual = new Date();
                    var eveVisFechaFin = ["3", "6", "7"];
                    if (eveVisFechaFin.includes(tipoEventoFin)) {
                        modelo.setProperty("/DatosGenerales/FFMAR", eventoFin.FFEVN);
                        modelo.setProperty("/DatosGenerales/HFMAR", eventoFin.HFEVN);
                    } else {
                        modelo.setProperty("/DatosGenerales/FFMAR", eventoFin.FIEVN);
                        modelo.setProperty("/DatosGenerales/HFMAR", eventoFin.HIEVN);
                    }
                    if (!mareaReabierta) {
                        var existeDesc = false;
                        for (let index = eventos.length; index > 0; index--) {
                            const element = eventos[index];
                            if (element.CDTEV == "6") {
                                existeDesc = true;
                                var fechaContabilizacion = Utils.strDateToDate("");//pasar fecha de contabilizacion de modelo pesca descargada
                                if ((fechaContabilizacion.getTime() - fechaActual.getTime()) >= 0) {
                                    modelo.setProperty("/Cabecera/ESCMA", "P");
                                }
                            }
                        }
                        if (!existeDesc && indPropiedad == "P" && !motivoSinZarpe.includes(motivoMarea)) {
                            modelo.setProperty("/Cabecera/ESCMA", "P");
                        }
                    }
                }
            }

            await this.guardarMarea();
            //actualizar obs comb
        },

        guardarMarea: async function () {
            var guardarDatosMarea = await this.guardarDatosMarea();
            if (guardarDatosMarea) {
                var modelo = this.getOwnerComponent().getModel("DetalleMarea");
                var nodMensajes = modelo.getProperty("/Utils/CrearMarea");
                var messageItems = modelo.getProperty("/Utils/MessageItemsDM");
                var nuevo = true;
                var mareaReabierta = true;
                var mensaje = this.getResourceBundle().getText("SUCCESSSAVE");
                var marea = modelo.getProperty("/Cabecera/NRMAR");
                var success = false;
                var warning = false;
                var error = false;

                modelo.setProperty("/Utils/MessageItemsEP", []);
                for (let index = 0; index < nodMensajes.length; index++) {
                    const element = nodMensajes[index];
                    var type = element.CMIN;
                    var desc = element.DSMIN;

                    if (type == "E") {
                        error = true;
                        var objMessage = {
                            type: 'Error',
                            title: 'Mensaje de Error',
                            activeTitle: false,
                            description: desc,
                            subtitle: desc,
                            counter: index
                        };
                        messageItems.push(objMessage);
                    } else if (type == "W") {
                        warning = true;
                        var objMessage = {
                            type: 'Warning',
                            title: 'Mensaje de Advertencia',
                            activeTitle: false,
                            description: desc,
                            subtitle: desc,
                            counter: index
                        };
                        messageItems.push(objMessage);
                    } else if (type == "S") {
                        success = true;
                    } else if (nuevo && type == "C") {
                        success = true;
                        marea = desc;
                    }
                }

                var descMotivoMarea = modelo.getProperty("/Cabecera/DESC_CDMMA");
                var codEmba = modelo.getProperty("/Cabecera/CDEMB");
                var nmemb = modelo.getProperty("/Cabecera/NMEMB");
                var txtMareaConfirm = marea + " " + descMotivoMarea;
                var txtEmbaConfirm = codEmba + " " + nmemb;
                modelo.setProperty("/Utils/TxtMareaConfirm", txtMareaConfirm);
                modelo.setProperty("/Utils/TxtEmbaConfirm", txtEmbaConfirm);
                this.getConfirmSaveDialog().open();

                /*
                if(nuevo){
                    modelo.setProperty("/Cabecera/NRMAR", marea);222222
                    mensaje += " " + this.getResourceBundle().getText("NROMAREAGEN") + " " + modelo.getProperty("/Cabecera/NRMAR");
                }

                if(success){
                    var objMessage = {
                        type: 'Success',
                        title: 'Mensaje de Exito',
                        activeTitle: false,
                        description: mensaje,
                        subtitle: mensaje,
                        counter: 1
                    };
                    messageItems.push(objMessage);
                }else{
                    var objMessage = {
                        type: 'Warning',
                        title: 'Mensaje de Advertencia',
                        activeTitle: false,
                        description: mensaje,
                        subtitle: mensaje,
                        counter: 1
                    };
                    messageItems.push(objMessage);
                }
                var oButton = this.getView().byId("messagePopoverBtn");
                oMessagePopover.getBinding("items").attachChange(function (oEvent) {
                    oMessagePopover.navigateBack();
                    oButton.setType(this.buttonTypeFormatter("DM"));
                    oButton.setIcon(this.buttonIconFormatter("DM"));
                    oButton.setText(this.highestSeverityMessages("DM"));
                }.bind(this));

                setTimeout(function () {
                    oMessagePopover.openBy(oButton);
                    oMessagePopover.navigateBack();
                    oButton.setType(this.buttonTypeFormatter("DM"));
                    oButton.setIcon(this.buttonIconFormatter("DM"));
                    oButton.setText(this.highestSeverityMessages("DM"));
                }.bind(this), 100);
                
                */
                //await this.enviarCorreosSiniestro();

            }
        },

        getConfirmSaveDialog: function () {
            if (!this.oDialogConfirmSave) {
                this.oDialogConfirmSave = sap.ui.xmlfragment("com.tasa.registroeventospescav2.view.fragments.EventoFinalizado", this);
                this.getView().addDependent(this.oDialogConfirmSave);
            }
            return this.oDialogConfirmSave;
        },

        onNavInicio: function(evt){
            var view = evt.getSource().getParent().getParent().getProperty("viewName");
            var viewName = view.split(".")[4];
            if(viewName == "DetalleMarea"){
                this.getConfirmSaveDialog().close();
                history.go(-1);//navegar a comp. reut. Lista Mareas
            }else{
                this.getConfirmSaveDialog().close();
                history.go(-2);//navegar a comp. reut. Lista Mareas
            }
            //console.log(evt.getSource().getParent().getParent().getProperty("viewName"));
            /*this.getConfirmSaveDialog().close();
            history.go(-1);*/
        },

        onNavVerMarea: function(evt){
            var view = evt.getSource().getParent().getParent().getProperty("viewName");
            var viewName = view.split(".")[4];
            if(viewName == "DetalleMarea"){
                this.getConfirmSaveDialog().close();
                //history.go(-1);
            }else{
                this.getConfirmSaveDialog().close();
                history.go(-1);
            }
            //console.log(evt.getSource().getParent().getParent().getProperty("viewName"));
            //this.getConfirmSaveDialog().close();
        },

        setDetalleMarea: async function (data) {
            BusyIndicator.show(0);
            var me = this;
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
            var dataDetalleMarea = modeloDetalleMarea.getData();
            var marea = data.s_marea[0];
            var eventos = data.s_evento;
            var incidental = data.str_pscinc;
            var biometria = data.str_flbsp;
            var motivoResCombu = ["1", "2", "4", "5", "6", "7", "8"];
            await this.clearAllData();//inicalizar valores
            modeloDetalleMarea.setProperty("/Cabecera/INDICADOR", "E");
            //setear cabecera de formulario
            //var cabecera = dataDetalleMarea.Cabecera;
            var cabecera = modeloDetalleMarea.getProperty("/Cabecera");
            for (var keyC in cabecera) {
                if (marea.hasOwnProperty(keyC)) {
                    cabecera[keyC] = marea[keyC];
                }
            }

            //setear pestania datos generales
            //var datsoGenerales = dataDetalleMarea.DatosGenerales;
            var datsoGenerales = modeloDetalleMarea.getProperty("/DatosGenerales");
            for (var keyC in datsoGenerales) {
                if (marea.hasOwnProperty(keyC)) {
                    datsoGenerales[keyC] = marea[keyC];
                }
            }

            //cargar dsitribucion de flota
            var codigo = modeloDetalleMarea.getProperty("/Cabecera/CDEMB");
            await this.obtenerDatosDistribFlota(codigo);

            var estMarea = modeloDetalleMarea.getProperty("/DatosGenerales/ESMAR");
            var marea = modeloDetalleMarea.getProperty("/Cabecera/NRMAR");
            if (estMarea == "A") {
                await this.obtenerDatosMareaAnt(marea, codigo);
            }

            //setear lista de eventos
            modeloDetalleMarea.setProperty("/Eventos/TituloEventos", "Eventos (" + eventos.length + ")")
            //dataDetalleMarea.Eventos.TituloEventos = "Eventos (" + eventos.length + ")";

            for (let index1 = 0; index1 < eventos.length; index1++) {
                const element = eventos[index1];
                element.Indicador = "E";
                element.LatitudD = Utils.getDegrees(element.LTGEO);
                element.LatitudM = Utils.getMinutes(element.LTGEO);
                element.LongitudD = Utils.getDegrees(element.LNGEO);
                element.LongitudM = Utils.getMinutes(element.LNGEO)
            }

            //dataDetalleMarea.Eventos.Lista = eventos;
            modeloDetalleMarea.setProperty("/Eventos/Lista", eventos);
            //dataDetalleMarea.Incidental = incidental;
            modeloDetalleMarea.setProperty("/Incidental", incidental);
            //dataDetalleMarea.Biometria = biometria;
            modeloDetalleMarea.setProperty("/Biometria", biometria);

            modeloDetalleMarea.setProperty("/Config/visibleTabReserva", false);
            modeloDetalleMarea.setProperty("/Config/visibleTabVenta", false);
            var inprp = modeloDetalleMarea.getProperty("/Cabecera/INPRP");
            var motivo = modeloDetalleMarea.getProperty("/Cabecera/CDMMA");
            if (inprp == "P" && motivoResCombu.includes(motivo)) {
                await this.obtenerReservasCombustible(marea, codigo);
            }

            if (inprp == "T") {
                await this.obtenerVentasCombustible(marea);
            }

            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.Session);
            var cdpta = oStore.get("CDPTA");
            modeloDetalleMarea.setProperty("/DatosGenerales/CDPTA", cdpta);
            modeloDetalleMarea.setProperty("/Cabecera/CDPTA", cdpta);
                    

            //la pestania de reserva de combustible y venta de combustible se setean en el Detalle

            //setear config inicial
            /*dataDetalleMarea.Config.visibleLinkSelecArmador = false;
            dataDetalleMarea.Config.visibleArmadorRuc = false;
            dataDetalleMarea.Config.visibleArmadorRazon = false;
            dataDetalleMarea.Config.visibleArmadorCalle = false;
            dataDetalleMarea.Config.visibleArmadorDistrito = false;
            dataDetalleMarea.Config.visibleArmadorProvincia = false;
            dataDetalleMarea.Config.visibleArmadorDepartamento = false;*/

            //refrescar modelo y navegar al detalle
            modeloDetalleMarea.refresh();
            BusyIndicator.hide();
            oRouter.navTo("DetalleMarea");
            //me.navToExternalComp();
        },

        guardarDatosMarea: async function () {
            var bOk = true;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var marea = {
                p_user: await this.getCurrentUser(),
                p_indir: modelo.getProperty("/Cabecera/INDICADOR"),
                p_newpr: modelo.getProperty("/Cabecera/NUEVOARM"),
                p_stcd1: modelo.getProperty("/DatosGenerales/NuevoArmador/RUC"),
                p_name1: modelo.getProperty("/DatosGenerales/NuevoArmador/RAZON"),
                p_stras: modelo.getProperty("/DatosGenerales/NuevoArmador/CALLE"),
                p_orto2: modelo.getProperty("/DatosGenerales/NuevoArmador/DISTRITO"),
                p_orto1: modelo.getProperty("/DatosGenerales/NuevoArmador/PROVINCIA"),
                p_regio: modelo.getProperty("/DatosGenerales/NuevoArmador/DEPARTAMENTO"),
                p_dsmma: modelo.getProperty("/Cabecera/CDMMA") == "1" ? "CHD" : null,
                str_marea: [],
                str_evento: [],
                str_equip: [],
                str_horom: [],
                str_psbod: [],
                str_psdec: [],
                str_flbsp_c: [],
                str_flbsp_e: [],
                str_pscinc: []
            };

            var objMarea = {
                INDTR: modelo.getProperty("/Cabecera/INDICADOR"),
                NRMAR: modelo.getProperty("/Cabecera/NRMAR"),
                CDEMB: modelo.getProperty("/Cabecera/CDEMB"),
                CDEMP: modelo.getProperty("/Cabecera/CDEMP"),
                CDMMA: modelo.getProperty("/DatosGenerales/CDMMA"),
                INUBC: modelo.getProperty("/DatosGenerales/INUBC"),
                FEARR: Utils.strDateToDate(modelo.getProperty("/DatosGenerales/FEARR")),
                //HEARR: modelo.getProperty("/DatosGenerales/HEARR"),
                HEARR: Utils.strHourToSapHo(modelo.getProperty("/DatosGenerales/HEARR")),
                OBMAR: modelo.getProperty("/Cabecera/OBMAR"),
                ESMAR: modelo.getProperty("/DatosGenerales/ESMAR"),
                //FEMAR: Utils.strDateToDate(modelo.getProperty("/DatosGenerales/FEMAR")),
                //HAMAR: modelo.getProperty("/DatosGenerales/HAMAR"),
                //HAMAR: Utils.strHourToSapHo(modelo.getProperty("/DatosGenerales/HAMAR")),
                FIMAR: Utils.strDateToDate(modelo.getProperty("/DatosGenerales/FIMAR")),
                //HIMAR: modelo.getProperty("/DatosGenerales/HIMAR"),
                HIMAR: Utils.strHourToSapHo(modelo.getProperty("/DatosGenerales/HIMAR")),
                FFMAR: Utils.strDateToDate(modelo.getProperty("/DatosGenerales/FFMAR")),
                //HFMAR: modelo.getProperty("/DatosGenerales/HFMAR"),
                HFMAR: Utils.strHourToSapHo(modelo.getProperty("/DatosGenerales/HFMAR")),
                CDPTA: modelo.getProperty("/Cabecera/CDPTA"),
                ESCMA: modelo.getProperty("/Cabecera/ESCMA"),
                FCCRE: Utils.strDateToDate(modelo.getProperty("/Cabecera/FCCRE")),
                //HRCRE: modelo.getProperty("/Cabecera/HRCRE"),
                HRCRE: Utils.strHourToSapHo(modelo.getProperty("/Cabecera/HRCRE")),
                ATCRE: modelo.getProperty("/Cabecera/ATCRE"),
                FCMOD: Utils.strDateToDate(modelo.getProperty("/Cabecera/FCMOD")),
                //HRMOD: modelo.getProperty("/Cabecera/HRMOD"),
                HRMOD: Utils.strHourToSapHo(modelo.getProperty("/Cabecera/HRMOD")),
                ATMOD: modelo.getProperty("/Cabecera/ATMOD")
            };

            var estadoMarea = modelo.getProperty("/DatosGenerales/ESMAR");
            if (estadoMarea == "C") {
                var currentDate = new Date();
                objMarea.FXMAR = currentDate;
                objMarea.HXMAR = Utils.strHourToSapHo(Utils.dateToStrHours(currentDate)),
                objMarea.AXMAR = await this.getCurrentUser();
            }

            var esNuevo = false;
            if (esNuevo) {
                var currentDate = new Date();
                objMarea.FEMAR = currentDate;
                objMarea.HAMAR = Utils.strHourToSapHo(Utils.dateToStrHours(currentDate)),
                objMarea.AAMAR = await this.getCurrentUser();
            }

            marea.str_marea.push(objMarea);
            var equipamientos = [];
            var horometros = [];
            var pescaDeclarada = [];
            var pescaBodega = [];
            var pescaDescargada = [];
            var siniestros = [];
            var eventos = modelo.getProperty("/Eventos/Lista");
            var motivoMarea = modelo.getProperty("/DatosGenerales/CDMMA");
            var eveVisTabEquip = ["1", "5"];
            var eveVisTabHorom = ["1", "5", "6", "H", "T"];
            var flagSaveEventos = modelo.getProperty("/Utils/TipoConsulta");
            for (let index = 0; index < eventos.length; index++) {
                let obs = "";
                var element = eventos[index];


                if ((element.KMEVN != "" && element.KMEVN != undefined) && (element.ObseAdicional != "" && element.ObseAdicional != undefined)) {
                    obs = element.KMEVN + " " + element.ObseAdicional;
                } else if (element.KMEVN != "") {
                    obs = element.KMEVN;
                } else {
                    obs = element.ObseAdicional ? element.ObseAdicional : "";
                }

                var evt = {
                    INDTR: element.INDTR == "N" ? "N" : "E",
                    NRMAR: element.NRMAR,
                    NREVN: element.NREVN,
                    CDTEV: element.CDTEV,
                    FIEVN: Utils.strDateToSapDate(element.FIEVN), //yyyyMMdd
                    HIEVN: Utils.strHourToSapHo(element.HIEVN),
                    FFEVN: Utils.strDateToSapDate(element.FFEVN),
                    HFEVN: Utils.strHourToSapHo(element.HFEVN),
                    FICAL: Utils.strDateToSapDate(element.FICAL),
                    HICAL: Utils.strHourToSapHo(element.HICAL),
                    FFCAL: Utils.strDateToSapDate(element.FFCAL),
                    HFCAL: Utils.strHourToSapHo(element.HFCAL),
                    CDZPC: element.CDZPC,
                    CDPTO: element.CDPTO,
                    CDPTA: element.CDPTA,
                    CDEMP: element.CDEMP,
                    CDMNP: element.CDMNP,
                    ESOPE: element.ESOPE,
                    ESTSF: element.ESTSF,
                    CDMLM: element.CDMLM,
                    STCMB: element.STCMB,
                    LTGEO: element.Latitud ? element.Latitud : element.LTGEO,
                    LNGEO: element.Longitud ? element.Longitud : element.LNGEO,
                    TEMAR: element.TEMAR,
                    CDTDS: element.CDTDS,
                    TMESP: element.TMESP,
                    CDMES: element.CDMES,
                    MUEST: element.MUEST,
                    ESEVN: element.ESEVN,
                    FCEVN: Utils.strDateToSapDate(element.FCEVN),
                    HCEVN: Utils.strHourToSapHo(element.HCEVN),
                    ACEVN: element.ACEVN,
                    FMEVN: Utils.strDateToSapDate(element.FMEVN),
                    HMEVN: Utils.strHourToSapHo(element.HMEVN),
                    AMEVN: element.AMEVN,
                    NRDES: element.NRDES,
                    ESTSF: element.ESTSF,
                    KMEVN: obs
                };

                if (flagSaveEventos == "C" || flagSaveEventos == "E") {
                    if (eveVisTabEquip.includes(element.CDTEV)) {
                        equipamientos = this.obtenerEquipamientos(element)
                    }

                    if (eveVisTabHorom.includes(element.CDTEV)) {
                        horometros = this.obtenerHorometrosRFC(element);
                    }

                    if (element.CDTEV == "3") {
                        pescaDeclarada = this.obtenerPescaDeclaradaRFC(element);
                        if (motivoMarea == "1") {
                            pescaBodega = this.obtenerPescaBodegaRFC(element);
                        }
                    }

                    if (element.CDTEV == "6") {
                        pescaDescargada = this.obtenerPescaDescargadaRFC(element);
                    }

                    if (element.CDTEV == "8") {
                        siniestros = this.obtenerSiniestros(element);
                    }
                }

                marea.str_evento.push(evt);
            }

            if (flagSaveEventos == "C" || flagSaveEventos == "E") {
                marea.str_flbsp_c = this.guardarDatosBiometria();
                marea.str_flbsp_e = this.eliminarDatosBiometria();
                marea.str_pscinc = this.guardarDatosIncidental();
                marea.str_simar = siniestros;
                marea.str_desca = pescaDescargada;
                marea.str_psbod = pescaBodega;
                marea.str_psdec = pescaDeclarada;
                marea.str_equip = equipamientos;
                marea.str_horom = horometros;
            }

            console.log("GUARDAR MAREA: ", marea);

            try {
                var guardar = await TasaBackendService.crearActualizarMarea(marea);
                if (guardar.length > 0) {
                    modelo.setProperty("/Utils/CrearMarea", guardar);
                    bOk = true;
                }
            } catch (error) {
                bOk = false;
                let msg = this.oBundle.getText("ERRORRFCSAVE");
                let msg2 = msg + " " + modelo.getProperty("/Utils/NumeroMarea") + ": " + error;
                MessageBox.error(msg);
            }

            if (bOk) {
                this.informarHorometroAveriado();
            }

            return bOk;

        },
        informarHorometroAveriado: function () {

        },
        enviarCorreosSiniestro: function () {

        },

        obtenerSiniestros: function (element) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var listaSiniestros = [];//modelo sinistros
            var siniestros = [];
            return siniestros;
        },

        obtenerEquipamientos: function (element) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            let elementSel = modelo.getProperty("/Eventos/LeadSelEvento");
            let ListaEventos = modelo.getProperty("/Eventos/Lista");
            var listaEquipamientos = ListaEventos[elementSel].ListaEquipamiento;//modelo equipamientos del evento (element)
            var equipamientos = [];
            for (let index = 0; index < listaEquipamientos.length; index++) {
                const element = listaEquipamientos[index];
                var obj = {
                    CDEMB: modelo.getProperty("/Cabecera/CDEMB"),
                    CDEQP: element.CDEQP,
                    CNEPE: element.CNEPE
                };
                equipamientos.push(obj);
            }
            return equipamientos;
        },

        obtenerHorometrosRFC: function (element) {
            let mod = this.getOwnerComponent().getModel("DetalleMarea");
            let elementSel = mod.getProperty("/Eventos/LeadSelEvento");
            let ListaEventos = mod.getProperty("/Eventos/Lista");
            var horometros = ListaEventos[elementSel].ListaHorometros; //modelo de horometros de la lista de eventos (element)
            var lista = [];
            for (let index = 0; index < horometros.length; index++) {
                const element = horometros[index];
                var listHorometros = {
                    INDTR: "N",
                    NRMAR: ListaEventos[elementSel].NRMAR,
                    NREVN: ListaEventos[elementSel].NREVN,
                    CDTHR: element.tipoHorometro,
                    LCHOR: element.lectura,
                    NORAV: element.averiado == null ? '' : element.averiado
                };
                lista.push(listHorometros);
            }
            return lista;
        },

        guardarDatosBiometria: function () {
            let mod = this.getOwnerComponent().getModel("DetalleMarea");
            let elementSel = mod.getProperty("/Eventos/LeadSelEvento");
            let ListaEventos = mod.getProperty("/Eventos/Lista");
            let motivoMarea = mod.getProperty("/Cabecera/CDMMA");
            let t_max = Number(mod.getProperty("/Utils/TallaMax"));
            let t_min = Number(mod.getProperty("/Utils/TallaMin"));
            var biom_list = [];
            var ListaBiomTemp = [];//modelo de biometria Temp
            // if (ListaBiom.length > 0) {
            //     //this.cargarRegistroBiometria();
            // }
            for (let index1 = 0; index1 < ListaEventos.length; index1++) {
                const element1 = ListaEventos[index1];
                if (element1.CDTEV == "3") {
                    let ListaBiom = element1.ListaBiometria ? element1.ListaBiometria : [];
                    for (let index = 0; index < ListaBiom.length; index++) {
                        const element = ListaBiom[index];
                        if (motivoMarea == "2") {
                            let v_talla_bio = Number(0);
                            for (let k = t_min; k <= t_max; k = k + Number(0.5)) {
                                if (k == t_min) {
                                    v_talla_bio = t_min;
                                } else {
                                    v_talla_bio++;
                                }

                                var Biometria = {
                                    NRMAR: ListaEventos[elementSel].NRMAR,
                                    NREVN: ListaEventos[elementSel].NREVN,
                                    CDSPC: element.CodEspecie,
                                    TMMED: k,
                                    CNSPC: element['col_' + v_talla_bio]
                                };
                                biom_list.push(Biometria);
                            }

                        } else if (motivoMarea == "1") {

                            for (let k = t_min; k <= t_max; k++) {
                                var Biometria = {
                                    NRMAR: ListaEventos[elementSel].NRMAR,
                                    NREVN: ListaEventos[elementSel].NREVN,
                                    CDSPC: element.CodEspecie,
                                    TMMED: k,
                                    CNSPC: element['col_' + k]
                                };
                                biom_list.push(Biometria);
                            }

                        }

                    }
                }

            }

            return biom_list;
        },

        eliminarDatosBiometria: function () {
            var ListaBiomElim = [];//modelo de lista de biometria eliminados
            var biom_list = [];
            for (let index = 0; index < ListaBiomElim.length; index++) {
                const element = ListaBiomElim[index];
                var Biometria = {
                    NRMAR: element.NRMAR,
                    NREVN: element.NREVN
                };
                biom_list.push(Biometria);
            }
            return biom_list;
        },

        guardarDatosIncidental: function () {
            let mod = this.getOwnerComponent().getModel("DetalleMarea");
            let elementSel = mod.getProperty("/Eventos/LeadSelEvento");
            let ListaEventos = mod.getProperty("/Eventos/Lista");
            var IncidenReg = ListaEventos[elementSel].ListaIncidental;//modelo de lista de pesca incidental
            var pscinc_list = [];
            for (let index = 0; index < IncidenReg.length; index++) {
                const element = IncidenReg[index];
                var incidental = {
                    CDSPC: element.CDSPC,
                    DSSPC: element.DSSPC,
                    NREVN: ListaEventos[elementSel].NREVN,
                    NRMAR: ListaEventos[elementSel].NRMAR,
                    PCSPC: element.PCSPC
                };
                pscinc_list.push(incidental);
            }
            return pscinc_list;
        },

        obtenerPescaBodegaRFC: function (elementParam) {
            let mod = this.getOwnerComponent().getModel("DetalleMarea");
            let elementSel = mod.getProperty("/Eventos/LeadSelEvento");
            let ListaEventos = mod.getProperty("/Eventos/Lista");
            var bodegas = ListaEventos[elementSel].ListaBodegas;//modelo de bodegas
            var lista = [];
            for (let index = 0; index < bodegas.length; index++) {
                const element = bodegas[index];
                var listBodegas = {
                    INDTR: element.INDTR ? element.INDTR : "N",
                    NRMAR: elementParam.NRMAR,
                    NREVN: elementParam.NREVN,
                    CDBOD: element.CDBOD,
                    CNPCM: element.CantPesca
                };
                lista.push(listBodegas);
            }
            return lista;
        },

        obtenerPescaDeclaradaRFC: function (elementParam) {
            let mod = this.getOwnerComponent().getModel("DetalleMarea");
            let elementSel = mod.getProperty("/Eventos/LeadSelEvento");
            let ListaEventos = mod.getProperty("/Eventos/Lista");
            var pescaDeclarada = ListaEventos[elementSel].ListaPescaDeclarada;//modelo pesca declarada
            var lista = [];
            for (let index = 0; index < pescaDeclarada.length; index++) {
                const element = pescaDeclarada[index];
                var listPescaDeclarada = {
                    INDTR: element.INDTR ? element.INDTR : "N",
                    //NRMAR: ListaEventos[elementSel].NRMAR,
                    NRMAR: elementParam.NRMAR,
                    //NREVN: ListaEventos[elementSel].NREVN,
                    NREVN: elementParam.NREVN,
                    CDSPC: element.CDSPC,
                    CNPCM: element.CNPCM,
                    CDUMD: element.UnidMedida,
                    ZMODA: element.ZMODA,
                    OBSER: element.OBSER,
                };
                lista.push(listPescaDeclarada);
            }
            return lista;
        },

        obtenerPescaDescargadaRFC: function (element) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var pescaDescargada = element.ListaPescaDescargada[0];//modelo pesca descargada
            var ePescaDescargada = element.ListaPescaDescargadaElim ? element.ListaPescaDescargadaElim : [];//modelo pesca descargada eliminada
            var lista = [];
            if (ePescaDescargada.length > 0) {
                var EListPescaDescargada = {
                    INDTR: ePescaDescargada.INDTR,
                    INDEJ: ePescaDescargada.INDEJ,
                    NRDES: ePescaDescargada.NRDES
                };
                lista.push(EListPescaDescargada);
            }


            var listPescaDescargada = {
                INDTR: pescaDescargada.INDTR,
                INDEJ: pescaDescargada.INDEJ,
                NRMAR: element.NRMAR,
                NREVN: element.NREVN,
                NRDES: pescaDescargada.NRDES ? pescaDescargada.NRDES : pescaDescargada.Nro_descarga,
                TICKE: pescaDescargada.TICKE,
                CDEMB: modelo.getProperty("/DatosGenerales/CDEMB"),
                CDPTA: pescaDescargada.CDPTA,
                INPRP: element.INPRP,
                CDSPC: pescaDescargada.CDSPC,
                CDPDG: pescaDescargada.CDPDG,
                CNPCM: pescaDescargada.CNPCM,
                CNPDS: pescaDescargada.CNPDS,
                PESACUMOD: pescaDescargada.PESACUMOD,
                FECCONMOV: Utils.strDateToSapDate(pescaDescargada.FECCONMOV),
                FIDES: Utils.strDateToSapDate(element.FIEVN),
                HIDES: Utils.strHourToSapHo(element.HIEVN),
                FFDES: Utils.strDateToSapDate(element.FFEVN),
                HFDES: Utils.strHourToSapHo(element.HFEVN),
                CDTPC: pescaDescargada.CDTPC,
                TPDES: pescaDescargada.TPDES ? pescaDescargada.TPDES : pescaDescargada.TipoDesc
            };

            lista.push(listPescaDescargada);
            return lista;
        },

        MainObtenerReservasCombustible: async function () {

        },

        crearReserva: async function () {
            var bOk = true;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var posiciones = this.obtenerPosiciones();
            var fechaReserva = modelo.getProperty("/Cabecera/FIEVN")
            var bodyReserva = {
                p_cdemb: modelo.getProperty("/Cabecera/CDEMB"),
                p_fhrsv: fechaReserva ? Utils.strDateToSapDate(fechaReserva) : "",
                p_lgort: modelo.getProperty("/Suministro/0/CDALE"),
                p_nrevn: modelo.getProperty("/Cabecera/NREVN"),
                p_user: await this.getCurrentUser(),
                str_rcb: posiciones
            };
            var crearReserva = await TasaBackendService.crearReserva(bodyReserva);
            if (crearReserva) {
                var t_mensaje = crearReserva.t_mensaje;
                modelo.setProperty("/Result/NroReserva", crearReserva.p_reserva)
                if (t_mensaje.length) {
                    if (t_mensaje[0].CMIN == "E") {
                        bOk = false;
                        MessageBox.error(t_mensaje[0].DSMIN);
                    }
                }
            } else {
                bOk = false;
            }
            return bOk;
        },

        crearVentaComb: async function () {
            var bOk = true;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var posiciones = this.obtenerPosiciones();
            var fechaReserva = modelo.getProperty("/Cabecera/FIEVN")
            var bodyReserva = {
                p_cdemb: modelo.getProperty("/Cabecera/CDEMB"),
                p_fhrsv: fechaReserva ? Utils.strDateToSapDate(fechaReserva) : "",
                p_lgort: modelo.getProperty("/Suministro/0/CDALE"),
                p_nrevn: modelo.getProperty("/Cabecera/NREVN"),
                p_nrmar: modelo.getProperty("/Cabecera/NRMAR"),
                p_user: await this.getCurrentUser(),
                p_werks: modelo.getProperty("/Suministro/0/WERKS"),
                str_rcb: posiciones
            };
            var crearVenta = await TasaBackendService.crearVenta(bodyReserva);
            if (crearVenta) {
                var t_mensaje = crearVenta.t_mensaje;
                modelo.setProperty("/Result/NroPedido", crearVenta.p_pedido)
                if (t_mensaje.length) {
                    if (t_mensaje[0].CMIN == "E") {
                        bOk = false;
                        MessageBox.error(t_mensaje[0].DSMIN);
                    }
                }
            } else {
                bOk = false;
            }
            return bOk;
        },

        obtenerPosiciones: function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var lista = [];
            var suministros = modelo.getProperty("/Suministro");
            for (let index = 0; index < suministros.length; index++) {
                const element = suministros[index];
                var obj = {
                    NRMAR: modelo.getProperty("/Cabecera/NRMAR"),
                    NRPOS: element.NRPOS,
                    CDSUM: element.CDSUM ? element.CDSUM : "",
                    CNSUM: element.CNSUM,
                    CDUMD: element.CDUMD ? element.CDUMD : "",
                    CDPTA: element.CDPTA,
                    CDALM: element.CDALE
                };
                lista.push(obj);
            }
            return lista;
        },

        obtenerReservas: async function (visibleNuevo) {
            BusyIndicator.show(0);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var marea = modelo.getProperty("/Cabecera/NRMAR");
            var usuario = await this.getCurrentUser();
            var mareaCerrada = modelo.getProperty("/DatosGenerales/ESMAR") == "C" ? true : false;
            var response = await TasaBackendService.obtenerReservas(marea, null, null, usuario);
            modelo.setProperty("/Config/visibleReserva1", false);
            modelo.setProperty("/Config/visibleReserva2", false);
            modelo.setProperty("/Utils/TxtBtnSuministro", "Reservar");
            if (response) {
                var reservas = response.t_reservas;
                if (reservas.length != 0) {
                    modelo.setProperty("/Config/visibleReserva2", true);
                    if (visibleNuevo) {
                        modelo.setProperty("/Config/visibleBtnNuevaReserva", true);
                    } else {
                        modelo.setProperty("/Config/visibleBtnNuevaReserva", false);
                    }
                    for (let index = 0; index < reservas.length; index++) {
                        const element = reservas[index];
                        element.CHKDE = false;
                    }
                    modelo.setProperty("/ReservasCombustible", reservas);
                    if (mareaCerrada) {
                        modelo.setProperty("/Config/visibleBtnNuevaReserva", false);
                        modelo.setProperty("/Config/visibleAnulaReserva", false);
                        modelo.setProperty("/Config/visibleCheckReserva", false);
                    } else {
                        modelo.setProperty("/Config/visibleBtnNuevaReserva", true);
                        modelo.setProperty("/Config/visibleAnulaReserva", true);
                        modelo.setProperty("/Config/visibleCheckReserva", true);
                    }
                } else {
                    await this.obtenerNuevoSuministro(true);
                }
            }
            BusyIndicator.hide();
        },

        obtenerReservasCombustible: async function (marea, codigo) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var listaEventos = modelo.getProperty("/Eventos/Lista");
            var motivoSinZarpe = ["3", "7", "8"];
            var eveReserCombus = ["4", "5", "6"];
            var visibleNuevo = true;
            var mostrarTab = false;
            var mareaCerrada = modelo.getProperty("/DatosGenerales/ESMAR") == "C" ? true : false;
            var usuario = await this.getCurrentUser();
            var response = await TasaBackendService.obtenerNroReserva(marea, usuario);
            var motivoMarea = modelo.getProperty("/Cabecera/CDMMA");
            var embarcacion = modelo.getProperty("/Cabecera/CDEMB");
            modelo.setProperty("/Config/visibleReserva1", false);
            modelo.setProperty("/Config/visibleReserva2", false);
            modelo.setProperty("/Config/visibleReserva3", false);
            if (response) {
                if (response.data.length > 0) {
                    mostrarTab = true;
                }
            }
            if (!mareaCerrada) {
                if (!motivoSinZarpe.includes(motivoMarea)) {
                    var ultimoEvento = listaEventos[listaEventos.length - 1];
                    var tipoUltEvnt = ultimoEvento.CDTEV;
                    visibleNuevo = eveReserCombus.includes(tipoUltEvnt);
                    if (!mostrarTab && visibleNuevo) {
                        mostrarTab = true;
                    }
                } else {
                    mostrarTab = true;
                }
            }
            modelo.setProperty("/Config/visibleTabReserva", mostrarTab);
            if (mostrarTab) {
                var configReservas = await TasaBackendService.obtenerConfigReservas(usuario);
                if (configReservas) {
                    modelo.setProperty("/ConfigReservas/BWART", configReservas.bwart);
                    modelo.setProperty("/ConfigReservas/MATNR", configReservas.matnr);
                    modelo.setProperty("/ConfigReservas/WERKS", configReservas.werks);
                    modelo.setProperty("/ConfigReservas/Almacenes", configReservas.almacenes);
                }
                var embaComb = await TasaBackendService.obtenerEmbaComb(usuario, embarcacion);
                if (embaComb) {
                    if (embaComb.data) {
                        var emba = embaComb.data[0];
                        var objEmbComb = modelo.getProperty("/EmbaComb");
                        for (var key in emba) {
                            if (objEmbComb.hasOwnProperty(key)) {
                                objEmbComb[key] = emba[key];
                            }
                        }
                    }
                }
                await this.obtenerReservas(visibleNuevo);
            }
        },

        obtenerVentasCombustible: async function (marea) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var listaEventos = modelo.getProperty("/Eventos/Lista");
            console.log("EVENTOS: ", listaEventos);
            var mostrarTab = false;
            var mareaCerrada = modelo.getProperty("/DatosGenerales/ESMAR") == "C" ? true : false;
            var usuario = await this.getCurrentUser();
            var embarcacion = modelo.getProperty("/Cabecera/CDEMB");
            var nroVenta = await TasaBackendService.obtenerNroReserva(marea, usuario);
            if (nroVenta) {
                mostrarTab = true;
            }
            var primerRegVenta = !mostrarTab;
            var regVenta = false;
            var tipoEvento = "";
            if (!mareaCerrada) {
                for (let index = 0; index < listaEventos.length; index++) {
                    const element = listaEventos[index];
                    tipoEvento = element.CDTEV;
                    if (tipoEvento == "5") {
                        //setear centro de planta de suministro
                        regVenta = true;
                        break;
                    }
                }
                if (regVenta) {
                    mostrarTab = true;
                } else {
                    mostrarTab = false;
                }
            }
            console.log("MOST5RAR TAB: ", mostrarTab);
            modelo.setProperty("/Config/visibleTabVenta", mostrarTab);
            if (mostrarTab) {
                var configReservas = await TasaBackendService.obtenerConfigReservas(usuario);
                if (configReservas) {
                    modelo.setProperty("/ConfigReservas/BWART", configReservas.bwart);
                    modelo.setProperty("/ConfigReservas/MATNR", configReservas.matnr);
                    modelo.setProperty("/ConfigReservas/WERKS", configReservas.werks);
                    modelo.setProperty("/ConfigReservas/Almacenes", configReservas.almacenes);
                }
                var embaComb = await TasaBackendService.obtenerEmbaComb(usuario, embarcacion);
                if (embaComb) {
                    if (embaComb.data) {
                        var emba = embaComb.data[0];
                        var objEmbComb = modelo.getProperty("/EmbaComb");
                        for (var key in emba) {
                            if (objEmbComb.hasOwnProperty(key)) {
                                objEmbComb[key] = emba[key];
                            }
                        }
                    }
                }
                await this.obtenerVentas(primerRegVenta);
            }
        },

        obtenerNuevoSuministro: async function (visible) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var usuario = await this.getCurrentUser();
            var eventos = modelo.getProperty("/Eventos/Lista");
            modelo.setProperty("/Config/visibleReserva1", visible);
            modelo.setProperty("/Config/visibleVenta2", visible);
            var ultimoEvento = eventos.length > 0 ? eventos[eventos.length - 1] : null;
            var descEvento = ultimoEvento ? ultimoEvento.DESC_CDTEV : "";
            var fechIniEve = ultimoEvento ? ultimoEvento.FIEVN : "";
            var numeroEvt = ultimoEvento ? ultimoEvento.NREVN : "";
            modelo.setProperty("/Cabecera/NREVN", numeroEvt);
            modelo.setProperty("/Cabecera/DESC_CDTEV", descEvento);
            modelo.setProperty("/Cabecera/FIEVN", fechIniEve);
            var planta = ultimoEvento ? ultimoEvento.CDPTA : "";
            var descr = ultimoEvento ? ultimoEvento.DESCR : "";
            var centro = modelo.getProperty("/ConfigReservas/WERKS");
            var material = modelo.getProperty("/ConfigReservas/MATNR");
            var data = await TasaBackendService.obtenerSuministro(usuario, material);
            if (data) {
                var suministro = data.data[0];
                var dsalm = "";
                var cdale = "";
                var almacenes = modelo.getProperty("/ConfigReservas/Almacenes");
                for (let index = 0; index < almacenes.length; index++) {
                    const element = almacenes[index];
                    if (element.DSALM == descr) {
                        dsalm = element.DSALM;
                        cdale = element.CDALE;
                    }
                }
                var listaSuministro = [{
                    NRPOS: "001",
                    CDSUM: suministro.CDSUM,
                    CNSUM: 0,
                    MAKTX: suministro.MAKTX,
                    CDUMD: suministro.CDUMD,
                    DSUMD: suministro.DSUMD,
                    CDPTA: planta,
                    DESCR: descr,
                    WERKS: centro,
                    DSALM: dsalm,
                    CDALE: cdale
                }];
                modelo.setProperty("/Suministro", listaSuministro);
            }
        },

        anularReservas: async function (reservas, indices) {
            BusyIndicator.show(0);
            var objAnular = {
                p_user: await this.getCurrentUser(),
                str_rsc: reservas
            };
            var anular = await TasaBackendService.anularReservas(objAnular);
            if (anular) {
                var me = this;
                var mssg = this.getResourceBundle().getText("ANULARESEXITO");
                MessageBox.success(mssg, {
                    title: "Exito",
                    onClose: async function () {
                        BusyIndicator.hide();
                        await me.obtenerReservas(true);
                    }
                });
            }
        },

        anularVentas: async function (ventas, indices) {
            BusyIndicator.show(0);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var obj = {
                p_ventas: ventas
            };
            var anular = await TasaBackendService.anularVenta(obj);
            if (anular) {
                var me = this;
                var mensajes = anular.t_mensaje;
                var messageItems = modelo.getProperty("/Utils/MessageItemsDM");
                for (let index = 0; index < mensajes.length; index++) {
                    const element = mensajes[index];
                    var objMessage = {
                        type: element.CMIN == 'S' ? 'Success' : 'Error',
                        title: element.CMIN == 'S' ? 'Mensaje de Éxito' : 'Mensaje de Error',
                        activeTitle: false,
                        description: element.DSMIN,
                        subtitle: element.DSMIN,
                        counter: index
                    };
                    messageItems.push(objMessage);
                }
                var oButton = this.getView().byId("messagePopoverBtn");
                oMessagePopover.getBinding("items").attachChange(function (oEvent) {
                    oMessagePopover.navigateBack();
                    oButton.setType(this.buttonTypeFormatter("DM"));
                    oButton.setIcon(this.buttonIconFormatter("DM"));
                    oButton.setText(this.highestSeverityMessages("DM"));
                }.bind(this));

                setTimeout(function () {
                    oMessagePopover.openBy(oButton);
                    oMessagePopover.navigateBack();
                    oButton.setType(this.buttonTypeFormatter("DM"));
                    oButton.setIcon(this.buttonIconFormatter("DM"));
                    oButton.setText(this.highestSeverityMessages("DM"));
                }.bind(this), 100);

                BusyIndicator.hide();
                await me.obtenerVentas(true);
            } else {
                BusyIndicator.hide();
            }

        },

        obtenerDetalleSuministro: async function (nrmar, nrrsv) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var usuario = await this.getCurrentUser();
            var bOk = false;
            var detalleSuministro = await TasaBackendService.obtenerReservas(nrmar, nrrsv, "X", usuario);
            if (detalleSuministro) {
                var reserva = detalleSuministro.t_reservas[0];
                var objReserva = modelo.getProperty("DetalleSuministro");
                for (var key in reserva) {
                    if (objReserva.hasOwnProperty(key)) {
                        objReserva[key] = reserva[key];
                    }
                }
                var detalles = detalleSuministro.t_detalle;
                modelo.setProperty("DetalleSuministro/Lista", detalles);
                bOk = true;
            }
            return bOk;
        },

        obtenerVentas: async function (primerRegVenta) {
            BusyIndicator.show(0);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var marea = modelo.getProperty("/Cabecera/NRMAR");
            var usuario = await this.getCurrentUser();
            var mareaCerrada = modelo.getProperty("/DatosGenerales/ESMAR") == "C" ? true : false;
            modelo.setProperty("/Config/visibleVenta1", false);
            modelo.setProperty("/Config/visibleVenta2", false);
            modelo.setProperty("/Utils/TxtBtnSuministro", "Vender");
            var response = await TasaBackendService.obtenerReservas(marea, null, null, usuario);
            if (response) {
                var ventas = response.t_reservas;
                if (ventas.length != 0) {
                    modelo.setProperty("/Config/visibleVenta1", true);
                    if (primerRegVenta) {
                        modelo.setProperty("/Config/visibleBtnNuevaVenta", true);
                    } else {
                        modelo.setProperty("/Config/visibleBtnNuevaVenta", false);
                    }
                    for (let index = 0; index < ventas.length; index++) {
                        const element = ventas[index];
                        element.CHKDE = false;
                    }
                    modelo.setProperty("/VentasCombustible", ventas);
                    if (mareaCerrada) {
                        modelo.setProperty("/Config/visibleBtnNuevaVenta", false);
                        modelo.setProperty("/Config/visibleAnulaVenta", false);
                        modelo.setProperty("/Config/visibleCheckVenta", false);
                    } else {
                        modelo.setProperty("/Config/visibleBtnNuevaVenta", true);
                        modelo.setProperty("/Config/visibleAnulaVenta", true);
                        modelo.setProperty("/Config/visibleCheckVenta", true);
                    }
                } else {
                    await this.obtenerNuevoSuministro(true);
                }
            }

            BusyIndicator.hide();
        },

        SaveGeneral: async function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var visbleObsComb = modelo.getProperty("/Utils/VisibleObsvComb");
            var obsComb = modelo.getProperty("/Cabecera/OBSCOMB");
            if (visbleObsComb && !obsComb) {
                var mssg = this.oBundle.getText("MISSOBSCOMB");;
                MessageBox.error(mssg);
            } else {
                await this.guardarCambios();
            }
        },
        buttonIconFormatter: function (vista) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var sIcon;
            var aMessages = modelo.getProperty("/Utils/MessageItems" + vista);

            aMessages.forEach(function (sMessage) {
                switch (sMessage.type) {
                    case "Error":
                        sIcon = "sap-icon://error";
                        break;
                    case "Warning":
                        sIcon = sIcon !== "sap-icon://error" ? "sap-icon://alert" : sIcon;
                        break;
                    case "Success":
                        sIcon = "sap-icon://error" && sIcon !== "sap-icon://alert" ? "sap-icon://sys-enter-2" : sIcon;
                        break;
                    default:
                        sIcon = !sIcon ? "sap-icon://information" : sIcon;
                        break;
                }
            });
            return sIcon;
        },
        highestSeverityMessages: function (vista) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var sHighestSeverityIconType = this.buttonTypeFormatter(vista);
            var sHighestSeverityMessageType;
            var aMessages = modelo.getProperty("/Utils/MessageItems" + vista);

            switch (sHighestSeverityIconType) {
                case "Negative":
                    sHighestSeverityMessageType = "Error";
                    break;
                case "Critical":
                    sHighestSeverityMessageType = "Warning";
                    break;
                case "Success":
                    sHighestSeverityMessageType = "Success";
                    break;
                default:
                    sHighestSeverityMessageType = !sHighestSeverityMessageType ? "Information" : sHighestSeverityMessageType;
                    break;
            }

            return aMessages.reduce(function (iNumberOfMessages, oMessageItem) {
                return oMessageItem.type === sHighestSeverityMessageType ? ++iNumberOfMessages : iNumberOfMessages;
            }, 0);
        },
        buttonTypeFormatter: function (vista) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var sHighestSeverityIcon;
            var aMessages = modelo.getProperty("/Utils/MessageItems" + vista);

            aMessages.forEach(function (sMessage) {
                switch (sMessage.type) {
                    case "Error":
                        sHighestSeverityIcon = "Negative";
                        break;
                    case "Warning":
                        sHighestSeverityIcon = sHighestSeverityIcon !== "Negative" ? "Critical" : sHighestSeverityIcon;
                        break;
                    case "Success":
                        sHighestSeverityIcon = sHighestSeverityIcon !== "Negative" && sHighestSeverityIcon !== "Critical" ? "Success" : sHighestSeverityIcon;
                        break;
                    default:
                        sHighestSeverityIcon = !sHighestSeverityIcon ? "Neutral" : sHighestSeverityIcon;
                        break;
                }
            });

            return sHighestSeverityIcon;
        },

        navToExternalComp: function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var dataModelo = modelo.getData();
            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.Session);
            oStore.put("DataModelo", dataModelo);
            oStore.put("AppOrigin", "registroeventospescav2");
            var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
            oCrossAppNav.toExternal({
                target: {
                    semanticObject: "mareaevento",
                    action: "display"
                }
            });
        },

        clearAllData: async function () {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            modelo.setProperty("/DatosGenerales/ESMAR", "A");
            modelo.setProperty("/Cabecera/FCCRE", Utils.strDateToSapDate(Utils.dateToStrDate(new Date())));
            modelo.setProperty("/Cabecera/HRCRE", Utils.strHourToSapHo(Utils.dateToStrHours(new Date())));
            modelo.setProperty("/Cabecera/ATCRE", await this.getCurrentUser());
        },

        validarErroresDescargaMarea: async function (nroDescarga) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var messageItems = modelo.getProperty("/Utils/MessageItemsDM");
            var usuario = await this.getCurrentUser();
            var erroresDescarga = await TasaBackendService.validarErroresDescarga(nroDescarga, usuario);
            if (erroresDescarga) {
                var mensajes = erroresDescarga.data;
                for (let index = 0; index < mensajes.length; index++) {
                    const element = mensajes[index];
                    if (element.CMIN == "E") {
                        var title = this.getResourceBundle().getText("PROGGENERAR");
                        if (element.TPROG == "A") {
                            title = this.getResourceBundle().getText("PROGANULAR");
                        }
                        //mssg += ": " + element.DSMEN;
                        var objMessage = {
                            type: 'Error',
                            title: title,
                            activeTitle: false,
                            description: element.DSMEN,
                            subtitle: element.DSMEN,
                            counter: index
                        };
                        messageItems.push(objMessage);
                    }
                }
            }
        },

        setVisibleBtnSave: function (btnSave, btnNext) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            if (btnSave) {
                modelo.setProperty("/Config/visibleBtnGuardar", true);
            } else {
                modelo.setProperty("/Config/visibleBtnGuardar", false);
            }

            if (btnNext) {
                modelo.setProperty("/Config/visibleBtnSiguiente", true);
            } else {
                modelo.setProperty("/Config/visibleBtnSiguiente", false);
            }

        },

        anularMarea: async function (marea) {
            BusyIndicator.show(0);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var anularMarea = await TasaBackendService.anularMarea(marea);
            if (anularMarea) {
                var mensajes = anularMarea.t_mensaje;
                modelo.setProperty("/Utils/MessageItemsMA", []);
                var messageItems = modelo.getProperty("/Utils/MessageItemsMA");
                for (let index = 0; index < mensajes.length; index++) {
                    const element = mensajes[index];
                    var objMessage = {
                        type: element.CMIN == 'S' ? 'Success' : 'Error',
                        title: element.CMIN == 'S' ? 'Mensaje de Éxito' : 'Mensaje de Error',
                        activeTitle: false,
                        description: element.DSMIN,
                        subtitle: element.DSMIN,
                        counter: index
                    };
                    messageItems.push(objMessage);
                }
            }
            BusyIndicator.hide();
        },

        anularDescargaMarea: async function(nroDescarga, anularEvento, nroEvento){
            var bOk = await this.anulaDescRfc(nroDescarga);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var marea = modelo.getProperty("/Cabecera/NRMAR");
            var usuario = await this.getCurrentUser();
            if(bOk){
                if(anularEvento){
                    await TasaBackendService.eliminarPescaDescargada(marea, nroEvento, usuario);
                }else{
                    await TasaBackendService.actualizarPescaDescargada(marea, nroEvento, usuario);
                }
            }
            return bOk;
        },

        anulaDescRfc: async function(nroDescarga){
            var bOk = true;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var anularDescarga = await TasaBackendService.anularDescargaRFC(nroDescarga);
            if(anularDescarga){
                var mensajes = anularDescarga.t_mensaje;
                modelo.setProperty("/Utils/MessageItemsDM", []);
                var messageItems = modelo.getProperty("/Utils/MessageItemsDM");
                for (let index = 0; index < mensajes.length; index++) {
                    const element = mensajes[index];
                    if(element.CMIN == "E"){
                        bOk = false;
                        var objMessage = {
                            type: 'Error',
                            title: 'Mensaje de Error',
                            activeTitle: false,
                            description: element.DSMIN,
                            subtitle: element.DSMIN,
                            counter: index
                        };
                        messageItems.push(objMessage);
                    }
                }
            }
            return bOk;
        }

    });

}
);