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

        getCurrentUser: async function () {
            /*const oUserInfo = await this.getUserInfoService();
            const sUserEmail = oUserInfo.getEmail(); //fgarcia@tasa.com.pe
            var emailSplit = sUserEmail.split("@");
            var usuario = emailSplit[0].toUpperCase();
            if (emailSplit[1] == "xternal.biz") {
                usuario = "FGARCIA";
            }
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
            var mareaReabierta = modelo.getProperty("/DataSession/MareaReabierta");
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
                                let fechContab = element.ListaPescaDescargada[0].FECCONMOV;
                                var fechaContabilizacion = Utils.strDateToDate(fechContab);//pasar fecha de contabilizacion de modelo pesca descargada
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
                    var type = element.cmin;
                    var desc = element.dsmin;

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
                        var intMarea = !isNaN(desc) ? parseInt(desc) : 0;
                        modelo.setProperty("/Cabecera/NRMAR", intMarea);
                        success = true;
                        marea = intMarea;

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

        onNavInicio: async function (evt) {
            BusyIndicator.show(0);
            var view = evt.getSource().getParent().getParent().getProperty("viewName");
            await this.onActualizaMareas();
            BusyIndicator.hide();
            var viewName = view.split(".")[4];
            if (viewName == "DetalleMarea") {
                this.getConfirmSaveDialog().close();
                history.go(-1);//navegar a comp. reut. Lista Mareas
            } else {
                this.getConfirmSaveDialog().close();
                history.go(-2);//navegar a comp. reut. Lista Mareas
            }
            //console.log(evt.getSource().getParent().getParent().getProperty("viewName"));
            /*this.getConfirmSaveDialog().close();
            history.go(-1);*/
        },

        onNavVerMarea: async function (evt) {
            BusyIndicator.show(0);
            var view = evt.getSource().getParent().getParent().getProperty("viewName");
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var marea = modelo.getProperty("/Cabecera/NRMAR");
            var estadoMarea = modelo.getProperty("/DatosGenerales/ESMAR");
            var embarcacion = modelo.getProperty("/Cabecera/CDEMB");
            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.Session);
            var initData = oStore.get('InitData');
            modelo.setData(initData);
            await this.cargarMarea(marea, estadoMarea, embarcacion, false);
            BusyIndicator.hide();
            var viewName = view.split(".")[4];
            if (viewName == "DetalleMarea") {
                this.getConfirmSaveDialog().close();
                //history.go(-1);
            } else {
                this.getConfirmSaveDialog().close();
                history.go(-1);
            }
            //console.log(evt.getSource().getParent().getParent().getProperty("viewName"));
            //this.getConfirmSaveDialog().close();
        },

        setDetalleMarea: async function (data, navegar) {
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
            var motivoSinZarpe = ["3", "7", "8"];
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
            await this.obtenerDatosDistribFlotaMarea(codigo);
            

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
            modeloDetalleMarea.setProperty("/Cabecera/EsNuevo", false);

            if(motivoSinZarpe.includes(motivo)){
                modeloDetalleMarea.setProperty("/Config/readOnlyFechIni", false);
                modeloDetalleMarea.setProperty("/Config/visibleFecHoEta", false);
                modeloDetalleMarea.setProperty("/Config/visibleFechIni", true);
                modeloDetalleMarea.setProperty("/Config/visibleFechFin", true);
                if(estMarea == "A" && motivo == "8"){
                    
                }
            }

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
            if (navegar) {
                oRouter.navTo("DetalleMarea");
            }else{
                BusyIndicator.show(0);
                sap.ui.controller("com.tasa.registroeventospescav2.controller.DetalleMarea").validaFechaNulaEvt(this);
                await sap.ui.controller("com.tasa.registroeventospescav2.controller.DetalleMarea").cargarCombos(this);
                await sap.ui.controller("com.tasa.registroeventospescav2.controller.DetalleMarea").validarVista(this);
                BusyIndicator.hide();
            }
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
                str_pscinc: [],
                str_desca: [],
                str_simar: []
            };

            var objMarea = {
                INDTR: modelo.getProperty("/Cabecera/INDICADOR"),
                NRMAR: modelo.getProperty("/Cabecera/NRMAR"),
                CDEMB: modelo.getProperty("/Cabecera/CDEMB"),
                CDEMP: modelo.getProperty("/DatosGenerales/CDEMP"),
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

            var esNuevo = modelo.getProperty("/Cabecera/EsNuevo");
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
            var eventosEliminados = modelo.getProperty("/Eventos/EvenEliminados");
            var nroMarea = modelo.getProperty("/Cabecera/NRMAR");

            for (let index1 = 0; index1 < eventosEliminados.length; index1++) {
                const element1 = eventosEliminados[index1];
                var horoElim = element1.EEHorometros;
                var bodElim = element1.EEBodegas;
                var pescDeclElim = element1.EEPescaDeclarada;
                var pescDescElim = element1.EEPescaDescargada;
                var evtElim = {
                    INDTR: "D",
                    NRMAR: nroMarea,
                    NREVN: element1.NREVN
                };
                marea.str_evento.unshift(evtElim);

                for (let index2 = 0; index2 < horoElim.length; index2++) {
                    const element2 = horoElim[index2];
                    var objHoroElim = {
                        INDTR: "D",
                        NRMAR: nroMarea,
                        NREVN: element1.NREVN,
                        CDTHR: element2.CDTHR
                    };
                    marea.str_horom.unshift(objHoroElim);
                }

                for (let index3= 0; index3 < bodElim.length; index3++) {
                    const element3 = bodElim[index3];
                    var objBodElim = {
                        INDTR: "D",
                        NRMAR: nroMarea,
                        NREVN: element1.NREVN,
                        CDBOD: element3.CDBOD
                    };
                    marea.str_psbod.unshift(objBodElim);
                }

                for (let index4 = 0; index4 < pescDeclElim.length; index4++) {
                    const element4 = pescDeclElim[index4];
                    var objPescDeclElim = {
                        INDTR: "D",
                        NRMAR: nroMarea,
                        NREVN: element1.NREVN,
                        CDSPC: element4.CDSPC
                    };
                    marea.str_psdec.unshift(objPescDeclElim);
                }

                for (let index5 = 0; index5 < pescDescElim.length; index5++) {
                    const element5 = pescDescElim[index5];
                    var objPescDesc = {
                        INDTR: "D",
                        INDJ: null,
                        NRDES: element5.NRDES
                    };
                    marea.str_desca.unshift(objPescDesc);
                }

            }

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
                marea.str_desca = marea.str_desca.concat(pescaDescargada);
                marea.str_psbod = marea.str_psbod.concat(pescaBodega);
                marea.str_psdec = marea.str_psdec.concat(pescaDeclarada);
                marea.str_equip = equipamientos;
                marea.str_horom = marea.str_horom.concat(horometros);
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
                let msg = this.getResourceBundle().getText("ERRORRFCSAVE");
                let msg2 = msg + " " + modelo.getProperty("/Utils/NumeroMarea") + ": " + error;
                MessageBox.error(msg);
            }

            if (bOk) {
                //this.informarHorometroAveriado();
            }

            return bOk;

        },
        informarHorometroAveriado: async function () { // errror
            let mod = this.getOwnerComponent().getModel("DetalleMarea");
            let ListaEventos = mod.getProperty("/Eventos/Lista");
            let Cabecera = mod.getProperty("/Cabecera");
            let listaHoroAveCorreo = [];
            ListaEventos.forEach(element => {
                if(true){
                    let LenghtHoro = element.ListaHorometros.length;
                    if(LenghtHoro > 0){
                        let ListHoro = element.ListaHorometros;
                        let ListHoroAve = ListHoro.filter(elem => elem.Chk_averiado == true);
                        if(ListHoroAve > 0){
                            let obj ={
                                horometrosAveriados : ListHoroAve,
                                nroEvento : element.NREVN
                            };
                            listaHoroAveCorreo.push(obj);
                        }
                    }
                }
                
            });

            if(listaHoroAveCorreo > 0){
                //llama al servicio de envio de correo
                let serv_correoHoroAve = TasaBackendService.envioCorreoHoroAve(Cabecera.NMEMB , listaHoroAveCorreo);
                let that = this;
                await Promise.resolve(serv_correoHoroAve).then(values => {
                    console.log(values);
                }).catch(reason => {

                });
            }

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
                    INDTR: element.indicador,
                    NRMAR: ListaEventos[elementSel].NRMAR,
                    NREVN: ListaEventos[elementSel].NREVN,
                    CDTHR: element.tipoHorometro,
                    LCHOR: element.lectura,
                    NORAV: element.Chk_averiado  === false ? "" : "A"
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
                modelo.setProperty("/Utils/NumeroReservaGen", crearReserva.p_reserva)
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
            var fechaReserva = Utils.dateToStrDate(new Date());
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
                modelo.setProperty("/Utils/NumeroPedidoGen", crearVenta.p_pedido)
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
            var almacenes = modelo.getProperty("/ConfigReservas/Almacenes");
            var indProp = modelo.getProperty("/Cabecera/INPRP");
            for (let index = 0; index < suministros.length; index++) {
                const element = suministros[index];
                var almacen = almacenes.find(function(param){
                    return param.CDALE == element.CDALE;
                });
                var obj = {
                    NRMAR: modelo.getProperty("/Cabecera/NRMAR"),
                    NRPOS: element.NRPOS,
                    CDSUM: element.CDSUM ? element.CDSUM : "",
                    CNSUM: element.CNSUM,
                    CDUMD: element.CDUMD ? element.CDUMD : "",
                    CDPTA: indProp == "P" ? element.CDPTA : element.WERKS,
                    CDALM: indProp == "P" && almacen.CDALM ? almacen.CDALM : element.CDALE
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
            modelo.setProperty("/Config/visibleAlmacenReserva", false);
            if (mostrarTab) {
                modelo.setProperty("/Config/visibleAlmacenReserva", true);
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

            modelo.setProperty("/Config/visibleTabVenta", mostrarTab);
            modelo.setProperty("/Config/visibleAlmacenExterno", false);
            if (mostrarTab) {
                var configReservas = await TasaBackendService.obtenerConfigReservas(usuario);
                if (configReservas) {
                    modelo.setProperty("/ConfigReservas/BWART", configReservas.bwart);
                    modelo.setProperty("/ConfigReservas/MATNR", configReservas.matnr);
                    modelo.setProperty("/ConfigReservas/WERKS", configReservas.werks);
                    modelo.setProperty("/ConfigReservas/Almacenes", configReservas.almacenes);
                }

                var almExt = await TasaBackendService.obtenerAlmExterno(usuario);
                if(almExt){
                    modelo.setProperty("/ConfigReservas/AlmacenesExt", almExt.data);
                    modelo.setProperty("/Config/visibleAlmacenExterno", true);
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
            var indProp = modelo.getProperty("/Cabecera/INPRP")
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
            if(indProp == "T"){
                for (let index1 = 0; index1 < eventos.length; index1++) {
                    const element = eventos[index1];
                    if (element.CDTEV == "5") {
                        centro = element.WERKS;
                        break;
                    }
                }
            }
            var material = modelo.getProperty("/ConfigReservas/MATNR");
            var data = await TasaBackendService.obtenerSuministro(usuario, material);
            if (data) {
                var almacenes = modelo.getProperty("/ConfigReservas/Almacenes");
                var suministro = data.data[0];
                var dsalm = "";
                var cdale = "";
                if(indProp == "P"){
                    for (let index = 0; index < almacenes.length; index++) {
                        const element = almacenes[index];
                        if (element.DSALM == descr) {
                            dsalm = element.DSALM;
                            cdale = element.CDALE;
                        }
                    }
                }else{
                    var almExt = await TasaBackendService.obtenerAlmExterno(usuario);
                    if(almExt){
                        modelo.setProperty("/ConfigReservas/AlmacenesExt", almExt.data);
                        var almacen = almExt.data[0];
                        dsalm = almacen.DESCR;
                        cdale = almacen.VAL01;
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
                /*
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
                }.bind(this), 100);*/

                BusyIndicator.hide();
                await me.obtenerVentas(true);
            } else {
                BusyIndicator.hide();
            }

        },

        obtenerDetalleSuministro: async function (nrmar, nrrsv) {
            BusyIndicator.show(0);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var usuario = await this.getCurrentUser();
            var bOk = false;
            var indProp = modelo.getProperty("/Cabecera/INPRP");
            var almacenesExterno = modelo.getProperty("/ConfigReservas/AlmacenesExt");
            var detalleSuministro = await TasaBackendService.obtenerReservas(nrmar, nrrsv, "X", usuario);
            if (detalleSuministro) {
                var reserva = detalleSuministro.t_reservas[0];
                var objReserva = modelo.getProperty("/DetalleSuministro");
                for (var key in reserva) {
                    if (objReserva.hasOwnProperty(key)) {
                        objReserva[key] = reserva[key];
                    }
                }
                var detalles = detalleSuministro.t_detalle;
                if(detalles.length > 0){
                    for (let index = 0; index < detalles.length; index++) {
                        const element = detalles[index];
                        if(!element.DSALM && indProp == "T"){
                            var almExt = almacenesExterno.find(function(param){
                                return param.VAL01 == element.CDALM;
                            });
                            element.DSALM = almExt.DESCR;
                        }
                    }
                    modelo.setProperty("/DetalleSuministro/Lista", detalles);
                    bOk = true;
                }
            }
            BusyIndicator.hide();
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
                var mssg = this.getResourceBundle().getText("MISSOBSCOMB");;
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
            var bOk = true;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var anularMarea = await TasaBackendService.anularMarea(marea);
            if (anularMarea) {
                var mensajes = anularMarea.t_mensaje;
                modelo.setProperty("/Utils/MessageItemsMA", []);
                var messageItems = modelo.getProperty("/Utils/MessageItemsMA");
                for (let index = 0; index < mensajes.length; index++) {
                    const element = mensajes[index];
                    if(element.CMIN == "E"){
                        bOk = false;
                    }
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
                modelo.refresh();
            }
            BusyIndicator.hide();
            return bOk;
        },

        anularDescargaMarea: async function (nroDescarga, anularEvento, nroEvento) {
            var bOk = await this.anulaDescRfc(nroDescarga);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var marea = modelo.getProperty("/Cabecera/NRMAR");
            var usuario = await this.getCurrentUser();
            if (bOk) {
                if (anularEvento) {
                    await TasaBackendService.eliminarPescaDescargada(marea, nroEvento, usuario);
                } else {
                    await TasaBackendService.actualizarPescaDescargada(marea, nroEvento, usuario);
                }
            }
            return bOk;
        },

        anulaDescRfc: async function (nroDescarga) {
            var bOk = true;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var anularDescarga = await TasaBackendService.anularDescargaRFC(nroDescarga);
            if (anularDescarga) {
                var mensajes = anularDescarga.t_mensaje;
                modelo.setProperty("/Utils/MessageItemsDM", []);
                var messageItems = modelo.getProperty("/Utils/MessageItemsDM");
                for (let index = 0; index < mensajes.length; index++) {
                    const element = mensajes[index];
                    if (element.CMIN == "E") {
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
        },

        verificarCambiosCodigo: async function (tipo, codigo, embarcacion) {
            //var form = this.getModel("Form");
            BusyIndicator.show(0);
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var bOk = null;
            if (codigo != null && codigo.trim().length > 0) {
                codigo = codigo.trim();
                if (tipo == "EMB") {
                    //if (this.bckEmbarcacion == null || codigo != this.bckEmbarcacion) {
                    modelo.setProperty("/DatosGenerales/CDMMA", null);
                    bOk = await this.buscarEmbarcacion(codigo, embarcacion);
                    //}
                } else if (tipo == "ARM") {
                    if (this.bckArmador == null || codigo != this.bckArmador) {
                        bOk = await this.buscarArmador(codigo);
                    }
                }
            }
            BusyIndicator.hide();
            return bOk;
        },

        validarBodegaCert: async function (codEmba, codPlanta) {
            var bOk = false;
            var usuario = await this.getCurrentUser();
            var response = await TasaBackendService.validarBodegaCert(codEmba, codPlanta, usuario);
            if (response) {
                bOk = response.estado;
            } else {
                bOk = null;
            }
            return bOk;
        },

        ValidacionMareaProduce: async function (codEmba, codPlanta) {
            var bOk = false;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            modelo.setProperty("/Utils/MessageItemsMA", []);
            var response1 = await TasaBackendService.validarMareaProd(codEmba, codPlanta);
            if (response1) {
                if (response1.p_correcto == "X") {
                    bOk = true;
                } else {
                    bOk = false;
                    var mensajes = response1.t_mensaje;
                    var messageItems = modelo.getProperty("/Utils/MessageItemsMA");
                    for (let index = 0; index < mensajes.length; index++) {
                        const element = mensajes[index];
                        var mssg = element.DSMIN;
                        var objMessage = {
                            type: 'Error',
                            title: 'Mensaje de Validación',
                            activeTitle: false,
                            description: mssg,
                            subtitle: mssg,
                            counter: (index + 1)
                        };
                        messageItems.push(objMessage);
                    }
                    modelo.refresh();
                }
            } else {
                bOk = null;
            }
            return bOk;
        },

        cargarMarea: async function (marea, estadoMarea, embarcacion, navegar) {
            BusyIndicator.show(0);
            var currentUser = await this.getCurrentUser();
            if (estadoMarea == "A") {
                var response = await TasaBackendService.obtenerDetalleMarea(marea, currentUser);
                if (response) {
                    BusyIndicator.hide();
                    await this.setDetalleMarea(response, navegar);
                }
            } else {
                var emba = await this.consultarEmba(embarcacion);
                if (emba) {
                    var bOk = await this.verificarCambiosCodigo("EMB", embarcacion, emba[0]);
                    if (!bOk) {
                        var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.Session);
                        var modelo = this.getOwnerComponent().getModel("DetalleMarea");
                        var codemba = modelo.getProperty("/DatosGenerales/CDEMB");
                        var codPlanta = modelo.getProperty("/DatosGenerales/CDPTA") ? modelo.getProperty("/DatosGenerales/CDPTA") : oStore.get("CDPTA");
                        var nmbemb = modelo.getProperty("/DatosGenerales/NMEMB");
                        var validaBodCert = await this.validarBodegaCert(codemba, codPlanta);
                        if (validaBodCert) { //se puso la admiracion para pruebas
                            var valMareaProd = await this.ValidacionMareaProduce(codemba, codPlanta);
                            if (valMareaProd) {//se puso la admiracion para pruebas
                                modelo.setProperty("/Cabecera/INDICADOR", "N");
                                modelo.setProperty("/DatosGenerales/ESMAR", "A");
                                modelo.setProperty("/Cabecera/EsNuevo", true);
                                BusyIndicator.hide();
                                if (navegar) {
                                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                                    oRouter.navTo("DetalleMarea");
                                }
                                //this.navToExternalComp();
                            }
                        } else {
                            BusyIndicator.hide();
                            MessageBox.error(this.getResourceBundle().getText("EMBANOPER", [nmbemb]));
                        }
                    }
                } else {
                    BusyIndicator.hide();
                    MessageBox.error(this.getResourceBundle().getText("NORESULTADOEMB"));
                }
            }
        },

        consultarEmba: async function (cdemb) {
            var options = [{
                "cantidad": "1",
                "control": "COMBOBOX",
                "key": "ESEMB",
                "valueHigh": "",
                "valueLow": "O"
            }, {
                "cantidad": "10",
                "control": "INPUT",
                "key": "CDEMB",
                "valueHigh": "",
                "valueLow": cdemb
            }];
            var emba = await TasaBackendService.obtenerEmbarcacion(options, []);
            return emba;
        },

        buscarArmador: async function (codigo) {
            var clearData = false;
            //var dataSesionModel = this.getModel("DataSession");
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var usuario = await this.getCurrentUser();
            var response = await TasaBackendService.buscarArmador(codigo, usuario);
            if (response) {
                //var form = this.getModel("Form");
                var data = response.data[0];
                modelo.setProperty("/DatosGenerales/NAME1", data.DSEMP);
            } else {
                var mssg = this.getResourceBundle().getText("NORESULTADOARMADOR");
                MessageBox.information(mssg);
                clearData = true;
            }
            if (clearData) {
                this.bckArmador = null;
                //form.setProperty("/Armador", null);
                modelo.setProperty("/Cabecera/CDEMP", null);
                modelo.setProperty("/DatosGenerales/CDEMP", null);
                //form.setProperty("/DescArmador", null);
                modelo.setProperty("/Cabecera/NAME1", null);
                modelo.setProperty("/DatosGenerales/NAME1", null);
            } else {
                this.bckArmador = codigo;
            }
        },

        buscarEmbarcacion: async function (codigo, embarcacion) {
            //var me = this;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var indPropiedad = "";
            var clearData = false;
            //var form = this.getModel("Form");
            //var filtro = this.getModel("Filtro")
            //var dataSesionModel = this.getModel("DataSession");
            //var visibleModel = this.getModel("Visible");
            //var utils = this.getModel("Utils");
            var usuario = await this.getCurrentUser();
            var valFijoPlanta = modelo.getProperty("/DatosGenerales/CDPTA");
            //visibleModel.setProperty("/EnlMarAnterior", false);
            //var emba = await TasaBackendService.buscarEmbarcacion(codigo, usuario);
            if (embarcacion) {
                await this.obtenerDatosMareaAnt(0, codigo);
                //var mareaAnterior = modelo.getProperty("/MareaAnterior");
                //console.log("Marea Anterior: ", mareaAnterior);
                //var estMarAnt = mareaAnterior.getProperty("/EstMarea");
                var estMarAnt = modelo.getProperty("/MareaAnterior/ESMAR");
                //var cieMarAnt = mareaAnterior.getProperty("/EstCierre");
                var cieMarAnt = modelo.getProperty("/MareaAnterior/ESCMA");
                var nrmarAnt = modelo.getProperty("/MareaAnterior/NRMAR");
                //var ce_embaElement = emba[0];
                var ce_embaElement = embarcacion;
                indPropiedad = ce_embaElement.INPRP;
                if (estMarAnt == "C") {
                    console.log("Mare Anterior Cerrada");
                    if (ce_embaElement.ESEMB == "O") {
                        var cabecera = modelo.getProperty("/Cabecera");
                        var datosGenerales = modelo.getProperty("/DatosGenerales");
                        for (var key in ce_embaElement) {
                            if (cabecera.hasOwnProperty(key)) {
                                cabecera[key] = ce_embaElement[key];
                            }
                            if (datosGenerales.hasOwnProperty(key)) {
                                datosGenerales[key] = ce_embaElement[key];
                            }
                        }

                        modelo.setProperty("/Cabecera/CDEMP", ce_embaElement.LIFNR);
                        modelo.setProperty("/DatosGenerales/CDEMP", ce_embaElement.LIFNR);

                        if (ce_embaElement.TCBPS) {
                            modelo.setProperty("/Cabecera/CPPMS", ce_embaElement.CPPMS);
                            modelo.setProperty("/Cabecera/TCBPS", ce_embaElement.TCBPS);
                            var sum = parseFloat(ce_embaElement.CPPMS) + parseFloat(ce_embaElement.TCBPS);
                            modelo.setProperty("/Cabecera/CBODP", sum.toFixed(3));
                        }
                        var consultarPermisoZarpe = await this.consultarPermisoZarpe(codigo);
                        if (indPropiedad == "P") {
                            modelo.setProperty("/Cabecera/WERKS", ce_embaElement.WERKS);
                            modelo.setProperty("/DatosGenerales/WERKS", ce_embaElement.WERKS);
                            var obtenerDatosDistribFlota = await this.obtenerDatosDistribFlotaMarea(codigo);
                            if (obtenerDatosDistribFlota) {
                                clearData = !consultarPermisoZarpe;
                            } else {
                                var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.getResourceBundle().getText("NOUBICENDISTRIB");
                                MessageBox.error(mssg);
                                clearData = true;
                            }
                        } else if (indPropiedad == "T") {
                            var obtenerDatosPlantaDist = await this.obtenerDatosPlantaDist(valFijoPlanta);
                            if (obtenerDatosPlantaDist) {
                                clearData = !consultarPermisoZarpe;
                            } else {
                                var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.getResourceBundle().getText("SELECCPLANTA");
                                MessageBox.error(mssg);
                                clearData = true;
                            }
                        } else {
                            var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.getResourceBundle().getText("NOINDPROPIEDAD");
                            MessageBox.error(mssg);
                            clearData = true;
                        }

                        if (!clearData) {
                            var valPerPescSur = this.validarPermisoPescaSur();
                            clearData = !valPerPescSur;
                        }
                    } else {
                        var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.getResourceBundle().getText("EMBNOPERATIVO");
                        MessageBox.error(mssg);
                        clearData = true;
                    }
                } else if (estMarAnt == "A") {
                    if (!cieMarAnt) {
                        //visibleModel.setProperty("/EnlMarAnterior", true);
                        var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.getResourceBundle().getText("EMBMAREAABIERTA");
                        console.log(mssg);
                        var me = this;
                        MessageBox.error(mssg, {
                            actions: ["Ver Marea", MessageBox.Action.CLOSE],
                            onClose: async function (sAction) {
                                console.log("Action: ", sAction);
                                if(sAction == "Ver Marea"){
                                    BusyIndicator.show(0);
                                    var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.Session);
                                    var initData = oStore.get('InitData');
                                    modelo.setData(initData);
                                    await me.cargarMarea(nrmarAnt, "A", null, true);
                                    BusyIndicator.hide();
                                }
                            }
                        });
                        clearData = true;
                    } else {
                        var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.getResourceBundle().getText("MAREATRATADAADMIN");
                        MessageBox.error(mssg);
                        clearData = true;
                    }
                }
            } else {
                var mssg = this.getResourceBundle().getText("NORESULTADOEMB");
                MessageBox.information(mssg);
                clearData = true;
            }
            if (clearData) {

                //this.bckEmbarcacion = null;
                //form.setProperty("/Embarcacion", null);
                modelo.setProperty("/Cabecera/CDEMB", null);
                //form.setProperty("/DescEmbarcacion", null);
                modelo.setProperty("/Cabecera/NMEMB", null);
                //form.setProperty("/Armador", null);
                modelo.setProperty("/Cabecera/CDEMP", null);
                modelo.setProperty("/DatosGenerales/CDEMP", null);
                //form.setProperty("/DescArmador", null);
                modelo.setProperty("/Cabecera/NAME1", null);
                modelo.setProperty("/DatosGenerales/NAME1", null);
                //form.setProperty("/SistPesca", null);
                modelo.setProperty("/DatosGenerales/CDSPE", null);
                modelo.setProperty("/DatosGenerales/DSSPE", null);
                //form.setProperty("/MotMarea", null);
                modelo.setProperty("/DatosGenerales/CDMMA", null);
            } else {
                this.validarIndPropiedad(indPropiedad);
                //this.bckEmbarcacion = codigo;
            }
            modelo.setProperty("/Cabecera/VEDAVERIF", false);
            //utils.setProperty("/VedaVerificada", false);
            return clearData;
        },

        validarIndPropiedad: function (ind) {
            //var visible = this.getModel("Visible");
            //var form = this.getModel("Form");
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");

            if (ind == null || (ind != null && ind == "T")) {
                modelo.setProperty("/Config/visibleBuscarArmador", true);//activar ayuda de bsuqeuda de armador
                modelo.setProperty("/Config/visibleLinkCrearArmador", true);
                modelo.setProperty("/Cabecera/CDEMP", null);
                modelo.setProperty("/Cabecera/NAME1", null);
                modelo.setProperty("/Cabecera/INPRP", "T");
            } else {//setArmLectura
                modelo.setProperty("/Config/visibleBuscarArmador", false);//DESACTIVAR  ayuda de bsuqeuda de armador
                modelo.setProperty("/Config/visibleLinkCrearArmador", false);
                modelo.setProperty("/Cabecera/INPRP", "P");
            }
        },

        validarPermisoPescaSur: function () {
            //var me = this;
            var bOk = true;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            //var distribFlota = modelo.getProperty("/DistribFlota");
            //var form = this.getModel("Form");
            var constantes = this.getModel("Constantes");
            var ubicPlanta = modelo.getProperty("/DistribFlota/CDUPT");
            var permisoSur = modelo.getProperty("/Cabecera/CNVPS");
            var fechaPerSur = modelo.getProperty("/Cabecera/FCVPS");
            var fechaPermiso = Utils.strDateToDate(fechaPerSur);
            var fechaActual = new Date();
            if (ubicPlanta == constantes.getProperty("/CodUbicSur")) {
                if (permisoSur == "S") {
                    if (fechaActual > fechaPermiso) {
                        bOk = false;
                        var mssg = this.getResourceBundle().getText("PERMISOSURVENCIO", [fechaPerSur]);
                        MessageBox.error(mssg);
                    }
                } else {
                    bOk = false;
                    var mssg = this.getResourceBundle().getText("NOPERMISOSUR");
                    MessageBox.error(mssg);
                }
            }
            return bOk;
        },

        obtenerDatosPlantaDist: async function (planta) {
            //var me = this;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            //var dataSesionModel = this.getModel("DataSession");
            //var usuario = dataSesionModel.getProperty("/User");
            var usuario = await this.getCurrentUser();
            //var distribFlota = this.getModel("DistribFlota");
            var distribFlota = modelo.getProperty("/DistribFlota");
            var constantsUtility = this.getOwnerComponent().getModel("ConstantsUtility");
            var caracterNuevo = constantsUtility.getProperty("/CARACTERNUEVO");
            var response = await TasaBackendService.obtenerDatosPlantaDist(planta, usuario);
            if (response) {
                for (var key in response) {
                    if (distribFlota.hasOwnProperty(key)) {
                        distribFlota[key] = response[key];
                    }
                }
                modelo.setProperty("/DistribFlota/Indicador", caracterNuevo);
                modelo.setProperty("/DistribFlota/IntLatPuerto", parseInt(response.LTGEO));
                modelo.setProperty("/DistribFlota/IntLonPuerto", parseInt(response.LNGEO));
                if (!response.DSEMP || !response.INPRP) {
                    var mssg = this.getResourceBundle().getText("PLANTASINEMPRESA");
                    MessageBox.error(mssg);
                    return false;
                } else {
                    return true;
                }
            } else {
                var mssg = this.getResourceBundle().getText("NODATOSPLANTA");
                MessageBox.error(mssg);
                return false;
            }
        },

        obtenerDatosDistribFlotaMarea: async function (codigo) {
            //var me = this;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            //var dataSesionModel = this.getModel("DataSession");
            //var usuario = dataSesionModel.getProperty("/User");
            var usuario = await this.getCurrentUser();
            //var distribFlota = this.getModel("DistribFlota");
            var distribFlota = modelo.getProperty("/DistribFlota");
            var constantsUtility = this.getOwnerComponent().getModel("ConstantsUtility");
            var caracterEditar = constantsUtility.getProperty("/CARACTEREDITAR");
            var response = await TasaBackendService.obtenerDatosDstrFlota(codigo, usuario);
            if (response) {
                for (var key in response) {
                    if (distribFlota.hasOwnProperty(key)) {
                        distribFlota[key] = response[key];
                    }
                }
                modelo.setProperty("/DistribFlota/Indicador", caracterEditar);
                modelo.setProperty("/DistribFlota/IntLatPuerto", parseInt(response.LTGEO));
                modelo.setProperty("/DistribFlota/IntLonPuerto", parseInt(response.LNGEO));
                if (!response.DSEMP || !response.INPRP) {
                    var mssg = this.getResourceBundle().getText("PLANTASINEMPRESA");
                    MessageBox.error(mssg);
                }
                modelo.refresh();
                return true;
            } else {
                return false;
            }
        },

        obtenerDatosMareaAnt: async function (marea, codigo) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var mareaAnterior = modelo.getProperty("/MareaAnterior");
            //var utilitario = this.getModel("Utilitario");
            //var dataSesionModel = this.getModel("DataSession");
            var usuario = await this.getCurrentUser();
            var motivosSinZarpe = ["3", "7", "8"]; // motivos sin zarpe
            //var mareaAnterior = this.getModel("MareaAnterior");
            var response = await TasaBackendService.obtenerMareaAnterior(marea, codigo, usuario);
            if (response) {
                var mareaAnt = response.data[0];
                for (var key in mareaAnt) {
                    if (mareaAnterior.hasOwnProperty(key)) {
                        mareaAnterior[key] = mareaAnt[key];
                    }
                }
                if (!motivosSinZarpe.includes(mareaAnt.CDMMA)) {
                    var response1 = await TasaBackendService.obtenerEventoAnterior(parseInt(mareaAnt.NRMAR), usuario);
                    if (response1) {
                        var eventoAnt = response1.data[0];
                        if (eventoAnt) {
                            var evtMarAnt = modelo.getProperty("/MareaAnterior/EventoMarAnt");
                            for (var key in eventoAnt) {
                                if (evtMarAnt.hasOwnProperty(key)) {
                                    evtMarAnt[key] = eventoAnt[key];
                                }
                            }
                        }
                    }
                }
            }
            modelo.refresh();
        },

        consultarPermisoZarpe: async function (codigo) {
            //var me = this;
            //var dataSesionModel = this.getModel("DataSession");
            var usuario = await this.getCurrentUser();
            //var form = this.getModel("Form");
            var form = this.getOwnerComponent().getModel("DetalleMarea");
            var puedeZarpar = await TasaBackendService.obtenerPermisoZarpe(codigo, usuario).then(function (response) {
                var bOk = true;
                if (response.data) {
                    var permiso = response.data[0];
                    if (permiso.ESPMS != "V") {
                        form.setProperty("/Cabecera/CDEMP", null);
                        form.setProperty("/Cabecera/NAME1", null);
                        var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.getResourceBundle().getText("EMBSUSPENDIDA");
                        MessageBox.error(mssg);
                        bOk = false;
                    }
                }
                return bOk;
            }).catch(function (error) {
                console.log("ERROR: Main.consultarPermisoZarpe - ", error);
                return null;
            });
            return puedeZarpar;
        },

        validarDataMareas: function (sData) {
            var modelo = this.getOwnerComponent().getModel("ListaMareas");
            var str_di = sData.str_di;
            var propios = [];
            var terceros = [];
            var mareaSinNumero = [];
            for (let index = 0; index < str_di.length; index++) {
                const element = str_di[index];

                //if (element.ESMAR = "" || (element.ESMAR == "A" && element.ESCMA == "") || (element.ESMAR == "C" && element.ESCMA == "P")) {

                if (!element.ESMAR || (element.ESMAR == "A" && !element.ESCMA) || (element.ESMAR == "C" && element.ESCMA && element.ESCMA == "P")) {
                    if (element.INPRP == "P") {
                        propios.push(element);
                    } else if (element.INPRP == "T") {
                        terceros.push(element);
                    }
                }

                /*
                if (element.NRMAR == 0) {
                    mareaSinNumero.push(element);
                }
                */
                //}
            }

            /*
            var tmpPropios = Utils.removeDuplicateArray(propios, it => it.NRMAR);
            var tmpTerceros = Utils.removeDuplicateArray(terceros, it => it.NRMAR);
            */

            //agregamos las mareas sin numero
            /*for (let index1 = 0; index1 < mareaSinNumero.length; index1++) {
                const element1 = mareaSinNumero[index1];
                tmpPropios.push(element1);
            }*/

            modelo.setProperty("/Propios", propios);
            modelo.setProperty("/Terceros", terceros);

            var listaModelos = this.getOwnerComponent().getModel("ListaMareas");
            listaModelos.setProperty("/Utils/readOnlyNuevaMarea", true);
            listaModelos.setProperty("/Utils/readOnlyActualizar", true);
            listaModelos.setProperty("/Utils/readOnlyPescDecl", true);

            /*
            var jsonModelPropios = new JSONModel(propios);
            var jsonModelTerceros = new JSONModel(terceros);*/
            //console.log("Modelo Propios: ", jsonModelPropios);
            /*this.getView().setModel(jsonModelPropios, "Propios");
            this.getView().setModel(jsonModelTerceros, "Terceros");
            this.getView().getModel("Propios").refresh();
            this.getView().getModel("Terceros").refresh();*/
        },

        filtarMareas: function (cdtem, cdpta) {
            var modelo = this.getOwnerComponent().getModel("ListaMareas");
            var dataModeloPropios = modelo.getProperty("/Propios");
            var dataModeloTerceros = modelo.getProperty("/Terceros");
            var dataPropios = [];
            var dataTerceros = [];
            var num = 0;
            var num1 = 0;
            var totalPescaDeclarada = 0;

            //filtrar propios
            for (let index = 0; index < dataModeloPropios.length; index++) {
                const element = dataModeloPropios[index];
                /*if (element.NMEMB == "TASA 55") {
                    console.log("TASA 55 Filter: ", element);
                }*/

                if (element.CDTEM == cdtem && element.CDPTA == cdpta) {
                    num++;
                    var tmpElement = Object.assign({}, element);
                    tmpElement.NRO = num;
                    var fehoarr = ""
                    if (tmpElement.FEARR) {
                        //var tmpDate = new Date(tmpElement.FEARR);
                        var fearr = tmpElement.FEARR;
                        fehoarr = fearr + " " + tmpElement.HEARR;
                    }
                    tmpElement.FEHOARR = fehoarr;

                    if (tmpElement.ESMAR == 'C' || tmpElement.CDEED == "010" || (tmpElement.ESMAR == "A" && tmpElement.ESCMA)) {

                        if (tmpElement.CDEED == "010") {

                        } else {

                        }
                        tmpElement.visibleAnularMarea = false;
                        tmpElement.DESCLINK = "Crear";

                    } else {
                        tmpElement.visibleAnularMarea = true;
                        tmpElement.DESCLINK = "Editar";

                    }

                    /*
                    tmpElement.DESCESMAR = "";
                    if (tmpElement.ESMAR == "A" || tmpElement.ESMAR == 'C') {
                        tmpElement.DESCESMAR = tmpElement.ESMAR == "A" ? "Abierto" : "Cerrado"
                    }
                    */
                    //validar descripcion link
                    /*if (tmpElement.ESMAR == "C" || tmpElement.CDEED == "010" || (tmpElement.ESMAR == "A" && tmpElement.ESCMA != "")) {
                        tmpElement.DESCLINK = "Crear"
                    } else {
                        tmpElement.DESCLINK = "Editar"
                    }*/

                    totalPescaDeclarada += tmpElement.CNPCM;

                    dataPropios.push(tmpElement);
                }
            }
            console.log("DATA PROPIOS: ", dataPropios);
            modelo.setProperty("/PropiosFiltro", dataPropios);
            /*var modeloMareaPropios = new JSONModel(dataPropios);
            this.getView().byId("tblMareasPropios").setModel(modeloMareaPropios);*/
            //modelo.setProperty("/Mareas/Propios", dataPropios);
            modelo.setProperty("/Utils/CountPropios", dataPropios.length);
            //this.getView().byId("itfPropios").setCount(dataPropios.length);


            //filtrar terceros
            for (let index1 = 0; index1 < dataModeloTerceros.length; index1++) {
                const element1 = dataModeloTerceros[index1];
                if (element1.CDTEM == cdtem && element1.CDPTA == cdpta) {
                    num1++;
                    var tmpElement1 = Object.assign({}, element1);
                    tmpElement1.NRO = num1;

                    var fehoarr = ""
                    if (tmpElement1.FEARR) {
                        //var tmpDate = new Date(tmpElement1.FEARR);
                        var fearr = tmpElement1.FEARR;
                        fehoarr = fearr + " " + tmpElement1.HEARR;
                    }
                    tmpElement1.FEHOARR = fehoarr;


                    if (tmpElement1.ESMAR == 'C' || tmpElement1.CDEED == "010" || (tmpElement1.ESMAR == "A" && tmpElement1.ESCMA)) {

                        if (tmpElement1.CDEED == "010") {

                        } else {

                        }
                        tmpElement1.visibleAnularMarea = false;
                        tmpElement1.DESCLINK = "Crear";

                    } else {
                        tmpElement1.visibleAnularMarea = true;
                        tmpElement1.DESCLINK = "Editar";

                    }


                    /*
                    tmpElement1.DESCESMAR = "";
                    if (tmpElement1.ESMAR == "A" || tmpElement1.ESMAR == 'C') {
                        tmpElement1.DESCESMAR = tmpElement1.ESMAR == "A" ? "Abierto" : "Cerrado"
                    }

                    //validar descripcion link
                    if (tmpElement1.ESMAR == "C" || tmpElement1.CDEED == "010" || (tmpElement1.ESMAR == "A" && tmpElement1.ESCMA != "")) {
                        tmpElement1.DESCLINK = "Crear"
                    } else {
                        tmpElement1.DESCLINK = "Editar"
                    }*/

                    dataTerceros.push(tmpElement1);
                }
            }
            //console.log("DATA TERCEROS: ", dataTerceros);
            modelo.setProperty("/TercerosFiltro", dataTerceros);
            /*var modeloMareaTerceros = new JSONModel(dataTerceros);
            this.getView().byId("tblMareasTerceros").setModel(modeloMareaTerceros);*/
            //modelo.setProperty("/Mareas/Terceros", dataTerceros);
            //this.getView().byId("itfTerceros").setCount(dataTerceros.length);
            modelo.setProperty("/Utils/CountTerceros", dataTerceros.length);

            //setear header para total de pesca declarada
            var ttPescaDecl = totalPescaDeclarada.toString();
            //this.getView().byId("idObjectHeader").setNumber(ttPescaDecl);
            modelo.setProperty("/Utils/TotalPescDecl", ttPescaDecl);
            modelo.setProperty("/Utils/SelectedKey", "itfPropios");
            //this.getView().byId("idIconTabBar").setSelectedKey("itfPropios");
        },

        onActualizaMareas: async function () {
            BusyIndicator.show(0);
            var me = this;
            var currentUser = await me.getCurrentUser();
            var oStore = jQuery.sap.storage(jQuery.sap.storage.Type.Session);
            var cdpta = oStore.get("CDPTA");
            var cdtem = oStore.get("CDTEM");
            if (cdtem && cdpta) {
                var listaMareas = await TasaBackendService.cargarListaMareas(currentUser);
                //console.log("Lista Mareas: ", listaMareas);
                if (listaMareas) {
                    this.validarDataMareas(listaMareas);
                    this.filtarMareas(cdtem, cdpta);
                    BusyIndicator.hide();
                    MessageBox.success("Se actualizó correctamente...", {
                        title: "Exitoso"
                    });
                }
            } else {
                MessageBox.information(this.oBundle.getText("ERRORSLECCIONEPLANTA"));
            }
        },

        getSerachingHelpComponents:function(oModel,sAyudaBusqId){
			let sUrlSubaccount = this.getHostSubaccount().url,
			aSearchingHelp = ["busqarmadores"],
			// iCountF = aSearchingHelp.length,
			// iCount = 0,
			oComponent,
			nameComponent,
			idComponent,
			urlComponent;
			
			// BusyIndicator.show(0);
			aSearchingHelp.forEach(elem=>{
				// let comCreateOk = function(oEvent){
				// 	if(iCountF === iCount) BusyIndicator.hide();
				// };
				oComponent = {};
				nameComponent = elem;
				idComponent = elem;
				urlComponent = `${sUrlSubaccount}/${sAyudaBusqId}.AyudasBusqueda.${elem}-1.0.0`;
				oComponent = new sap.ui.core.ComponentContainer({
					id:idComponent,
					name:nameComponent,
					url:urlComponent,
					settings:{},
					componentData:{},
					propagateModel:true,
					// componentCreated:comCreateOk,
					height:'100%',
					// manifest:true,
					async:false
				});
				oModel.setProperty(`/${elem}`,oComponent)
				// iCount++
			});
		},

        getHostSubaccount: function () {

            var urlIntance = window.location.origin,

            sUrlSubaccount,

            sParam;



            if (urlIntance.indexOf('tasaqas') !== -1) {

                sUrlSubaccount = 'tasaqas'; // aputando a QAS

                sParam = "IDH4_QAS"

            } else if (urlIntance.indexOf('tasaprd') !== -1) {

                sUrlSubaccount = 'tasaprd'; // apuntando a PRD

                sParam = "IDH4_PRD"

            }else if(urlIntance.indexOf('localhost') !== -1){

                sUrlSubaccount = 'tasadev'; // apuntando a DEV

                sParam = "IDH4_DEV"

            }else{

                sUrlSubaccount = 'tasadev'; // apuntando a DEV

                sParam = "IDH4_DEV"

            }



            return {

                url : `https://${sUrlSubaccount}.launchpad.cfapps.us10.hana.ondemand.com`,

                param : sParam

            };

        },

        onLocation:function(){

			var oRouter = window.location.origin;
	
			console.log(oRouter)
	
			var service="";
	
			if(oRouter.indexOf("localhost") !== -1){
	
				service='https://cf-nodejs-cheerful-bat-js.cfapps.us10.hana.ondemand.com/api/'
	
			}
	
			if(oRouter.indexOf("tasadev")!== -1){
	
				service='https://cf-nodejs-cheerful-bat-js.cfapps.us10.hana.ondemand.com/api/'
	
			}
	
			if(oRouter.indexOf("tasaprd")!==-1){
	
				service='https://cf-nodejs-prd.cfapps.us10.hana.ondemand.com/api/'
	
			}
	
			if(oRouter.indexOf("tasaqas")!==-1){
	
				service='https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com/api/'
	
			}
	
			console.log(service);
	
			return service;
	
		},

        _getHelpSearch:  function(){
			var oRouter = window.location.origin;
			var service=[];
			if(oRouter.indexOf("localhost") !== -1){
				service.push({
					url:"https://tasaqas.launchpad.cfapps.us10.hana.ondemand.com/",
					parameter:"IDH4_QAS"
				})
			}
			if(oRouter.indexOf("tasadev")!== -1){
				service.push({
					url:"https://tasadev.launchpad.cfapps.us10.hana.ondemand.com/",
					parameter:"IDH4_DEV"
				})
			}
			if(oRouter.indexOf("tasaprd")!==-1){
				service.push({
					url:"https://tasaprd.launchpad.cfapps.us10.hana.ondemand.com/",
					parameter:"IDH4_PRD"
				})
			}
			if(oRouter.indexOf("tasaqas")!==-1){
				service.push({
					url:"https://tasaqas.launchpad.cfapps.us10.hana.ondemand.com/",
					parameter:"IDH4_QAS"
				})
			}
			return service;
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

        validarMotivo: async function (motivo) {
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var indicador = modelo.getProperty("/Cabecera/INDICADOR");
            modelo.setProperty("/Cabecera/CDMMA", motivo);
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


    });

}
);