sap.ui.define([
    "./MainComp.controller",
    "./FormCust",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "../Service/TasaBackendService",
    "../Formatter/formatter",
    "./Utils",
    "../model/models",
    "sap/ui/core/BusyIndicator",
],

    function (MainComp, FormCust, Controller, JSONModel, MessageBox, TasaBackendService, formatter, Utils, models, BusyIndicator) {
        "use strict";

        const mainUrlServices = 'https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com/api/';

        return MainComp.extend("com.tasa.registroeventospescav2.controller.Main", {

            formatter: formatter,
            //FormCust: FormCust,

            onInit: function () {
                var currentUser = this.getCurrentUser();
                this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                //this.formCust = sap.ui.controller("com.tasa.registroeventospescav2.controller.FormCust")
                var me = this;
                TasaBackendService.obtenerTipoEmbarcacion(currentUser).then(function (tipoEmbarcacion) {
                    TasaBackendService.obtenerPlantas(currentUser).then(function (plantas) {
                        me.prepararDataTree(tipoEmbarcacion, plantas.data);//metodo para armar la data y setear el modelo del tree
                        TasaBackendService.cargarListaMareas(currentUser).then(function (mareas) {
                            //console.log("Mareas: ", mareas);
                            me.validarDataMareas(mareas);
                        }).catch(function (error) {
                            console.log("ERROR: Main.onInit - " + error);
                        });
                    }).catch(function (error) {
                        console.log("ERROR: Main.onInit - " + error);
                    });
                }).catch(function (error) {
                    console.log("ERROR: Main.onInit - " + error);
                });
                this.CDTEM = "";
                this.CDPTA = "";
                this.primerOption = [];
                this.segundoOption = [];
                this.currentPage = "";
                this.lastPage = "";
                this.bckEmbarcacion = null;
                this.bckArmador = null;
                //this.filtarMareas("001","0012");//por defecto muestra la primera opcion

                this.loadInitData();
            },

            _onPatternMatched: function () {

            },

            loadInitData: function () {
                let zinprpDom = [];
                let plantas = [];
                const bodyDominios = {
                    "dominios": [
                        {
                            "domname": "ZINPRP",
                            "status": "A"
                        }
                    ]
                };
                fetch(`${mainUrlServices}dominios/Listar`,
                    {
                        method: 'POST',
                        body: JSON.stringify(bodyDominios)
                    })
                    .then(resp => resp.json()).then(data => {
                        zinprpDom = data.data.find(d => d.dominio == "ZINPRP").data;
                        this.getOwnerComponent().getModel("ComboModel").setProperty("/IndPropiedad", zinprpDom);
                    }).catch(error => console.log(error));

                const bodyAyudaPlantas = {
                    "nombreAyuda": "BSQPLANTAS",
                    "p_user": this.getCurrentUser()
                };

                fetch(`${mainUrlServices}General/AyudasBusqueda/`,
                    {
                        method: 'POST',
                        body: JSON.stringify(bodyAyudaPlantas)
                    })
                    .then(resp => resp.json()).then(data => {
                        plantas = data.data;
                        this.getOwnerComponent().getModel("ComboModel").setProperty("/Plantas", plantas);
                    }).catch(error => console.log(error));
                
                this.validarRoles();
            },

            prepararDataTree: function (dataTipoEmba, dataPlantas) {
                var iconTipoEmba = "sap-icon://sap-box";
                var iconPlantas = "sap-icon://factory";
                var dataTree = [];
                for (let index = 0; index < dataTipoEmba.length; index++) {
                    var tmpNodes = [];
                    const element = dataTipoEmba[index];
                    for (let index1 = 0; index1 < dataPlantas.length; index1++) {
                        const element1 = dataPlantas[index1];
                        var plantasNode = {
                            text: element1.DESCR,
                            ref: iconPlantas,
                            cdtem: element.cdtem,
                            cdpta: element1.CDPTA,
                            descr: element.descr
                        };
                        tmpNodes.push(plantasNode);
                    }
                    var tipoEmbaNode = {
                        text: element.descr,
                        ref: iconTipoEmba,
                        nodes: tmpNodes
                    };
                    dataTree.push(tipoEmbaNode);
                }
                var modelTree = new JSONModel(dataTree);
                this.getView().byId("navigationList").setModel(modelTree);
            },

            validarDataMareas: function (sData) {
                var str_di = sData.str_di;
                var propios = [];
                var terceros = [];
                var mareaSinNumero = [];
                for (let index = 0; index < str_di.length; index++) {
                    const element = str_di[index];
                    if (element.NMEMB == "TASA 55") {
                        console.log("TASA 55: ", element);
                    }
                    //if (element.ESMAR = "" || (element.ESMAR == "A" && element.ESCMA == "") || (element.ESMAR == "C" && element.ESCMA == "P")) {
                    if (element.INPRP == "P") {
                        propios.push(element);
                    } else if (element.INPRP == "T") {
                        terceros.push(element);
                    }

                    if (element.NRMAR == 0) {
                        mareaSinNumero.push(element);
                    }

                    //}
                }

                var tmpPropios = Utils.removeDuplicateArray(propios, it => it.NRMAR);
                var tmpTerceros = Utils.removeDuplicateArray(terceros, it => it.NRMAR);

                //agregamos las mareas sin numero
                for (let index1 = 0; index1 < mareaSinNumero.length; index1++) {
                    const element1 = mareaSinNumero[index1];
                    tmpPropios.push(element1);
                }

                var jsonModelPropios = new JSONModel(tmpPropios);
                var jsonModelTerceros = new JSONModel(tmpTerceros);
                console.log("Modelo Propios: ", jsonModelPropios);
                this.getView().setModel(jsonModelPropios, "Propios");
                this.getView().setModel(jsonModelTerceros, "Terceros");
                this.getView().getModel("Propios").refresh();
                this.getView().getModel("Terceros").refresh();
            },

            onSearchMarea: function (evt) {
                //console.log(evt)
                var selectedItem = evt.getParameter("item").getBindingContext().getObject();
                var modelo = this.getOwnerComponent().getModel("DetalleMarea");
                if (selectedItem.cdtem && selectedItem.cdpta) {
                    var oGlobalBusyDialog = new sap.m.BusyDialog();
                    var cdtem = selectedItem.cdtem;
                    var cdpta = selectedItem.cdpta;
                    var txtCabecera = selectedItem.text + " - " + selectedItem.descr;
                    this.getView().byId("idObjectHeader").setTitle(txtCabecera);
                    modelo.setProperty("/DatosGenerales/CDPTA", cdpta)
                    this.CDTEM = cdtem;
                    this.CDPTA = cdpta;
                    this.filtarMareas(cdtem, cdpta);
                    oGlobalBusyDialog.close();
                }
            },

            filtarMareas: function (cdtem, cdpta) {
                var dataModeloPropios = this.getView().getModel("Propios").getData();
                var dataModeloTerceros = this.getView().getModel("Terceros").getData();
                var dataPropios = [];
                var dataTerceros = [];
                var num = 0;
                var num1 = 0;
                var totalPescaDeclarada = 0;
                console.log("modeloPropios: ", dataModeloPropios);
                //filtrar propios
                for (let index = 0; index < dataModeloPropios.length; index++) {
                    const element = dataModeloPropios[index];
                    if (element.NMEMB == "TASA 55") {
                        console.log("TASA 55 Filter: ", element);
                    }

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

                        tmpElement.DESCESMAR = "";
                        if (tmpElement.ESMAR == "A" || tmpElement.ESMAR == 'C') {
                            tmpElement.DESCESMAR = tmpElement.ESMAR == "A" ? "Abierto" : "Cerrado"
                        }

                        //validar descripcion link
                        if (tmpElement.ESMAR == "C" || tmpElement.CDEED == "010" || (tmpElement.ESMAR == "A" && tmpElement.ESCMA != "")) {
                            tmpElement.DESCLINK = "Crear"
                        } else {
                            tmpElement.DESCLINK = "Editar"
                        }
                        totalPescaDeclarada += tmpElement.CNPCM;

                        dataPropios.push(tmpElement);
                    }
                }
                var modeloMareaPropios = new JSONModel(dataPropios);
                this.getView().byId("tblMareasPropios").setModel(modeloMareaPropios);
                this.getView().byId("itfPropios").setCount(dataPropios.length);

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

                        tmpElement1.DESCESMAR = "";
                        if (tmpElement1.ESMAR == "A" || tmpElement1.ESMAR == 'C') {
                            tmpElement1.DESCESMAR = tmpElement1.ESMAR == "A" ? "Abierto" : "Cerrado"
                        }

                        //validar descripcion link
                        if (tmpElement1.ESMAR == "C" || tmpElement1.CDEED == "010" || (tmpElement1.ESMAR == "A" && tmpElement1.ESCMA != "")) {
                            tmpElement1.DESCLINK = "Crear"
                        } else {
                            tmpElement1.DESCLINK = "Editar"
                        }

                        dataTerceros.push(tmpElement1);
                    }
                }
                var modeloMareaTerceros = new JSONModel(dataTerceros);
                this.getView().byId("tblMareasTerceros").setModel(modeloMareaTerceros);
                this.getView().byId("itfTerceros").setCount(dataTerceros.length);

                //setear header para total de pesca declarada
                var ttPescaDecl = totalPescaDeclarada.toString();
                this.getView().byId("idObjectHeader").setNumber(ttPescaDecl);
                this.getView().byId("idIconTabBar").setSelectedKey("itfPropios");
            },

            onNavToDetailMaster: function () {

            },

            onActualizaMareas: function () {
                BusyIndicator.show(0);
                var me = this;
                var currentUser = me.getCurrentUser();
                if (me.CDTEM && me.CDPTA) {
                    TasaBackendService.cargarListaMareas(currentUser).then(function (mareas) {
                        me.validarDataMareas(mareas);
                        me.filtarMareas(me.CDTEM, me.CDPTA);
                        BusyIndicator.hide();
                        MessageBox.success("Se actualizó correctamente...", {
                            title: "Exitoso"
                        });
                    }).catch(function (error) {
                        console.log("ERROR: Main.onActualizaMareas - " + error);
                    });
                } else {
                    MessageBox.information(this.oBundle.getText("ERRORSLECCIONEPLANTA"));
                }
            },

            onActionCrearMarea: function () {
                //abrir poup
                var me = this;
                var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
                var dataDetalleMarea = modeloDetalleMarea.getData();
                var currentUser = this.getCurrentUser();
                TasaBackendService.obtenerPlantas(currentUser).then(function (plantas) {
                    dataDetalleMarea.Config.datosCombo.Plantas = plantas.data; // cargar combo plantas nueva marea
                    modeloDetalleMarea.refresh();
                }).catch(function (error) {
                    console.log("ERROR: Main.onInit - " + error);
                });
                me.getDialog().open();
            },

            onCancelMarea: function () {
                this.getDialog().close();
            },

            onCrearMarea: async function () {
                //var me = this;
                this.getDialog().close();
                /*var formModel = this.getModel("Form");
                var filtroModel = this.getModel("Filtro");
                var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
                modeloDetalleMarea.refresh();
                var dataDetalleMarea = modeloDetalleMarea.getData();
                var embarcacion = formModel.getProperty("/Embarcacion");//modeloDetalleMarea.GETPROPERTY("/FormNewMarea/Planta");
                var embaDesc = dataDetalleMarea.FormNewMarea.EmbarcacionDesc
                var planta = sap.ui.getCore().byId("cbxPlantas").getSelectedKey();
                console.log(embarcacion);
                if (embarcacion && planta) {
                    var bOk = await this.validaBodMar(embarcacion, planta, embaDesc);
                    console.log("validaBodMar: ", bOk);
                    if (bOk) {
                        this.getOwnerComponent().setModel(models.createInitModel(), "DetalleMarea");
                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("DetalleMarea");
                    }
                } else {
                    MessageBox.information(this.oBundle.getText("NEWMAREAMISSFIELD"));
                }*/
                var modelo = this.getOwnerComponent().getModel("DetalleMarea");
                var codemba = modelo.getProperty("/DatosGenerales/CDPTA");
                var codPlanta = modelo.getProperty("/DatosGenerales/CDEMB");
                var nmbemb = modelo.getProperty("/DatosGenerales/NMEMB");
                var validaBodCert = await this.validarBodegaCert(codemba, codPlanta);
                if (validaBodCert) { //se puso la admiracion para pruebas
                    var valMareaProd = await this.ValidacionMareaProduce(codemba, codPlanta);
                    if (!valMareaProd) {//se puso la admiracion para pruebas
                        modelo.setProperty("/Cabecera/INDICADOR", "N");
                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("DetalleMarea");
                    } else {
                        MessageBox.error(this.oBundle.getText("EMBANOPROD", [nmbemb]));
                    }
                } else {
                    MessageBox.error(this.oBundle.getText("EMBANOPER", [nmbemb]));
                }
            },

            onEditarCrearMarea: async function (evt) {
                var selectedItem = evt.getSource().getParent().getBindingContext().getObject();
                var me = this;
                if (selectedItem) {
                    var currentUser = this.getCurrentUser();
                    if (selectedItem.ESMAR == "A") {
                        var response = await TasaBackendService.obtenerDetalleMarea(selectedItem.NRMAR, currentUser);
                        if (response) {
                            await this.setDetalleMarea(response);
                        }
                    } else {
                        //buscar embarcacion
                        var options = [{
                            "cantidad": "20",
                            "control": "COMBOBOX",
                            "key": "ESEMB",
                            "valueHigh": "",
                            "valueLow": "O"
                        }, {
                            "cantidad": "20",
                            "control": "INPUT",
                            "key": "CDEMB",
                            "valueHigh": "",
                            "valueLow": selectedItem.CDEMB
                        }];

                        var emba = await TasaBackendService.obtenerEmbarcacion(options, []);
                        if (emba) {
                            var bOk = await this.verificarCambiosCodigo("EMB", selectedItem.CDEMB, emba[0]);
                            if (!bOk) {
                                var modelo = this.getOwnerComponent().getModel("DetalleMarea");
                                var codemba = modelo.getProperty("/DatosGenerales/CDPTA");
                                var codPlanta = modelo.getProperty("/DatosGenerales/CDEMB");
                                var nmbemb = modelo.getProperty("/DatosGenerales/NMEMB");
                                var validaBodCert = await this.validarBodegaCert(codemba, codPlanta);
                                if (validaBodCert) { //se puso la admiracion para pruebas
                                    var valMareaProd = await this.ValidacionMareaProduce(codemba, codPlanta);
                                    if (!valMareaProd) {//se puso la admiracion para pruebas
                                        modelo.setProperty("/Cabecera/INDICADOR", "N");
                                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                                        oRouter.navTo("DetalleMarea");
                                    } else {
                                        MessageBox.error(this.oBundle.getText("EMBANOPROD", [nmbemb]));
                                    }
                                } else {
                                    MessageBox.error(this.oBundle.getText("EMBANOPER", [nmbemb]));
                                }
                            }
                        } else {
                            MessageBox.error(this.oBundle.getText("NORESULTADOEMB"));
                        }
                    }

                } else {
                    console.log("ERROR: Main.onEditarCrearMarea - " + this.oBundle.getText("ERRORITEMSELECCIONADO"));
                }


            },

            validaBodMar: async function (cdemb, cdpta, nmemb) {
                var bOk = false;
                var response = await TasaBackendService.validarBodegaCert(cdemb, cdpta);
                if (response.estado) {
                    var response1 = await TasaBackendService.validarMareaProd(cdemb, cdpta);
                    if (response1.p_correcto == "X") {
                        bOk = true;
                    } else {
                        MessageBox.error(this.oBundle.getText("EMBANOPROD", [nmemb]));
                    }
                } else {
                    MessageBox.error(this.oBundle.getText("EMBANOPER", [nmemb]));
                }
                return bOk;
            },

            setDetalleMarea: async function (data) {
                var me = this;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
                var dataDetalleMarea = modeloDetalleMarea.getData();
                var marea = data.s_marea[0];
                var eventos = data.s_evento;
                var incidental = data.str_pscinc;
                var biometria = data.str_flbsp;
                var motivoResCombu = ["1", "2", "4", "5", "6", "7", "8"];
                console.log("Marea: ", marea);
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
                oRouter.navTo("DetalleMarea");
            },

            obtenerReservasCombustible: async function (marea, codigo) {
                var modelo = this.getOwnerComponent().getModel("DetalleMarea");
                var motivoSinZarpe = ["3", "7", "8"];
                var eveReserCombus = ["4", "5", "6"];
                var visibleNuevo = true;
                var mostrarTab = false;
                var mareaCerrada = modelo.getProperty("/DatosGenerales/ESMAR") == "C" ? true : false;
                var usuario = this.getCurrentUser();
                var response = await TasaBackendService.obtenerNroReserva(marea, usuario);
                var motivoMarea = modelo.getProperty("/Cabecera/CDMMA");
                var eventos = modelo.getProperty("/Eventos/Lista");
                modelo.setProperty("/Config/visibleReserva1", false);
                modelo.setProperty("/Config/visibleReserva2", false);
                modelo.setProperty("/Config/visibleReserva3", false);
                if (response) {
                    if (response.data) {
                        mostrarTab = true;
                    }
                }

                if (!mareaCerrada) {
                    if (!motivoSinZarpe.includes(motivoMarea)) {
                        var listaEventos = modelo.getProperty("/Eventos/Lista");
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
                    var marea = modelo.getProperty("/Cabecera/NRMAR")
                    var response = await TasaBackendService.obtenerReservas(marea, null, null, usuario);
                    if (response) {
                        var reservas = response.t_reservas;
                        modelo.setProperty("/ResCombustible", reservas);
                        if (!mareaCerrada) {
                            var configReservas = await TasaBackendService.obtenerConfigReservas(usuario);
                            if(configReservas){
                                modelo.setProperty("/ConfigReservas/BWART", configReservas.bwart);
                                modelo.setProperty("/ConfigReservas/MATNR", configReservas.matnr);
                                modelo.setProperty("/ConfigReservas/WERKS", configReservas.werks);
                                modelo.setProperty("/ConfigReservas/Almacenes", configReservas.almacenes);
                            }
                            if(reservas.length != 0){
                                modelo.setProperty("/Config/visibleReserva2", true);
                                if(visibleNuevo){
                                    modelo.setProperty("/Config/visibleBtnNuevaReserva", true);
                                }else{
                                    modelo.setProperty("/Config/visibleBtnNuevaReserva", false);
                                }
                                for (let index = 0; index < reservas.length; index++) {
                                    const element = reservas[index];
                                    element.CHKDE = false;
                                }
                                modelo.setProperty("/ReservasCombustible", reservas);
                            }else{
                                modelo.setProperty("/Config/visibleReserva1", true);
                                var ultimoEvento = eventos.length > 0 ? eventos[eventos.length - 1] : null;
                                var descEvento = ultimoEvento ? ultimoEvento.DESC_CDTEV : "";
                                var fechIniEve = ultimoEvento ? ultimoEvento.FIEVN : "";
                                modelo.setProperty("/Cabecera/DESC_CDTEV", descEvento);
                                modelo.setProperty("/Cabecera/FIEVN", fechIniEve);
                                var planta = ultimoEvento ? ultimoEvento.CDPTA : "";
                                var descr = ultimoEvento ? ultimoEvento.DESCR : "";
                                var centro = modelo.getProperty("/ConfigReservas/WERKS");
                                var material = modelo.getProperty("/ConfigReservas/MATNR");
                                var data = await TasaBackendService.obtenerSuministro(usuario, material);
                                if(data){
                                    var suministro = data.data;
                                    var dsalm = "";
                                    var cdale = "";
                                    var almacenes = modelo.getProperty("/ConfigReservas/Almacenes");
                                    for (let index = 0; index < almacenes.length; index++) {
                                        const element = almacenes[index];
                                        if(element.DSALM == descr){
                                            dsalm = element.DSALM;
                                            cdale = element.CDALE;
                                        }
                                    }
                                    var listaSuministro = [{
                                        NRPOS: "001",
                                        CDSUM: suministro.CDSUM,
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
                            }
                        } else {
                            modelo.setProperty("/ReservasCombustible", reservas);
                            modelo.setProperty("/Config/visibleReserva3", true);
                        }
                    }
                }

            },

            preparaFormulario: function () {
                var me = this;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
                var dataDetalleMarea = modeloDetalleMarea.getData();

                modeloDetalleMarea.refresh();
                oRouter.navTo("DetalleMarea");
            },

            getCurrentUser: function () {
                return "fgarcia";
            },

            getRolUser: function(){
                return [];//este metodo debe devolver la lista de roles asignado. Ejem. ["Administrador", "Operador"]
            },

            getDialog: function () {
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment("com.tasa.registroeventospescav2.view.fragments.NuevaMarea", this);
                    this.getView().addDependent(this.oDialog);
                }
                return this.oDialog;
            },

            onSelectTab: function (evt) {
                var key = evt.getParameter("key");
                var totalPescaDeclarada = 0;
                var modelo = null;
                if (key.includes("itfPropios")) {
                    modelo = this.getView().byId("tblMareasPropios").getModel();
                }

                if (key.includes("itfTerceros")) {
                    modelo = this.getView().byId("tblMareasTerceros").getModel();
                }

                if (modelo) {
                    var data = modelo.getData();
                    if (data.length > 0) {
                        for (let index = 0; index < data.length; index++) {
                            const element = data[index];
                            totalPescaDeclarada += element.CNPCM;
                        }
                    }
                } else {
                    MessageBox.error(this.oBundle.getText("ERRORSELECPESTANIA"));
                }
                var ttPescaDeca = totalPescaDeclarada.toString();
                this.getView().byId("idObjectHeader").setNumber(ttPescaDeca);
            },

            onActionSelPlanta: function (evt) {
                var utils = this.getModel("Utils");
                var formModel = this.getModel("Form");
                var embarcacion = formModel.getProperty("/Embarcacion");
                if (embarcacion) {
                    utils.setProperty("/BtnEnabled", true);
                }
            },

            getEmbaDialog: function () {
                if (!this.oDialogEmba) {
                    this.oDialogEmba = sap.ui.xmlfragment("com.tasa.registroeventospescav2.view.fragments.Embarcacion", this);
                    this.getView().addDependent(this.oDialogEmba);
                }
                return this.oDialogEmba;
            },

            onAbrirAyudaEmbarcacion: function (evt) {
                this.getEmbaDialog().open();
            },

            onSelectEmba: async function (evt) {
                var object = evt.getParameter("listItem").getBindingContext("ComboModel").getObject();
                //var formModel = this.getModel("Form");
                /*formModel.setProperty("/Embarcacion", object.CDEMB);
                formModel.setProperty("/DescEmbarcacion", object.NMEMB);*/
                this.getEmbaDialog().close();

                var bOk = await this.verificarCambiosCodigo("EMB", object.CDEMB, object);
                if (!bOk) {
                    /*sap.ui.getCore().byId("txtEmba").setValue(formModel.getProperty("/Embarcacion"));
                    sap.ui.getCore().byId("txtEmba").setDescription(formModel.getProperty("/DescEmbarcacion"));*/
                    sap.ui.getCore().byId("btnAceptarCrearMarea").setEnabled(true);
                }

                //await FormCust.buscarArmador(object.CDEMB);
                /*var s = await FormCust.consultarPermisoZarpe(object.CDEMB)
                console.log(s);*/
                //var a  = new FormCust;
                //MainComp.FormCust().verificarCambiosCodigo("EMB", formModel.getProperty("/Embarcacion"))
                //FormCust.verificarCambiosCodigo("EMB", formModel.getProperty("/Embarcacion"));

                /*var indices = evt.mParameters.listItem.oBindingContexts.ComboModel.sPath.split("/")[2];
                console.log(indices);

                var data = this.getView().getModel("ComboModel").oData.Embarcaciones[indices].CDEMB;
                sap.ui.getCore().byId("txtEmba").setValue(data);
                this.onCerrarEmba();*/

            },

            clearFilterEmba: function () {
                sap.ui.getCore().byId("idEmba").setValue(null);
                sap.ui.getCore().byId("idNombEmba").setValue(null);
                sap.ui.getCore().byId("idRucArmador").setValue(null);
                sap.ui.getCore().byId("idMatricula").setValue(null);
                sap.ui.getCore().byId("indicadorPropiedad").setSelectedKey(null);
                sap.ui.getCore().byId("idDescArmador").setValue(null);
                this.getOwnerComponent().getModel("ComboModel").setProperty("/Embarcaciones", []);
                this.getOwnerComponent().getModel("ComboModel").setProperty("/NumerosPaginacion", []);
                this.getOwnerComponent().getModel("ComboModel").refresh();

            },

            onSearchEmbarcacion: function () {
                BusyIndicator.show(0);
                var idEmbarcacion = sap.ui.getCore().byId("idEmba").getValue();
                var idEmbarcacionDesc = sap.ui.getCore().byId("idNombEmba").getValue();
                var idMatricula = sap.ui.getCore().byId("idMatricula").getValue();
                var idRuc = sap.ui.getCore().byId("idRucArmador").getValue();
                var idArmador = sap.ui.getCore().byId("idDescArmador").getValue();
                var idPropiedad = sap.ui.getCore().byId("indicadorPropiedad").getSelectedKey();
                var options = [];
                var options2 = [];
                let embarcaciones = [];
                options.push({
                    "cantidad": "20",
                    "control": "COMBOBOX",
                    "key": "ESEMB",
                    "valueHigh": "",
                    "valueLow": "O"
                })
                if (idEmbarcacion) {
                    options.push({
                        "cantidad": "20",
                        "control": "INPUT",
                        "key": "CDEMB",
                        "valueHigh": "",
                        "valueLow": idEmbarcacion

                    });
                }
                if (idEmbarcacionDesc) {
                    options.push({
                        "cantidad": "20",
                        "control": "INPUT",
                        "key": "NMEMB",
                        "valueHigh": "",
                        "valueLow": idEmbarcacionDesc.toUpperCase()

                    });
                }
                if (idMatricula) {
                    options.push({
                        "cantidad": "20",
                        "control": "INPUT",
                        "key": "MREMB",
                        "valueHigh": "",
                        "valueLow": idMatricula
                    });
                }
                if (idPropiedad) {
                    options.push({
                        "cantidad": "20",
                        "control": "COMBOBOX",
                        "key": "INPRP",
                        "valueHigh": "",
                        "valueLow": idPropiedad
                    });
                }
                if (idRuc) {
                    options2.push({
                        "cantidad": "20",
                        "control": "INPUT",
                        "key": "STCD1",
                        "valueHigh": "",
                        "valueLow": idRuc
                    });
                }
                if (idArmador) {
                    options2.push({
                        "cantidad": "20",
                        "control": "INPUT",
                        "key": "NAME1",
                        "valueHigh": "",
                        "valueLow": idArmador.toUpperCase()
                    });
                }

                this.primerOption = options;
                this.segundoOption = options2;

                var body = {
                    "option": [

                    ],
                    "option2": [

                    ],
                    "options": options,
                    "options2": options2,
                    "p_user": "BUSQEMB",
                    //"p_pag": "1" //por defecto la primera parte
                };

                fetch(`${mainUrlServices}embarcacion/ConsultarEmbarcacion/`,
                    {
                        method: 'POST',
                        body: JSON.stringify(body)
                    })
                    .then(resp => resp.json()).then(data => {
                        console.log("Emba: ", data);
                        embarcaciones = data.data;

                        this.getOwnerComponent().getModel("ComboModel").setProperty("/Embarcaciones", embarcaciones);
                        this.getOwnerComponent().getModel("ComboModel").refresh();

                        if (!isNaN(data.p_totalpag)) {
                            if (Number(data.p_totalpag) > 0) {
                                sap.ui.getCore().byId("goFirstPag").setEnabled(true);
                                sap.ui.getCore().byId("goPreviousPag").setEnabled(true);
                                sap.ui.getCore().byId("comboPaginacion").setEnabled(true);
                                sap.ui.getCore().byId("goLastPag").setEnabled(true);
                                sap.ui.getCore().byId("goNextPag").setEnabled(true);
                                var tituloTablaEmba = "Página 1/" + Number(data.p_totalpag);
                                this.getOwnerComponent().getModel("ComboModel").setProperty("/TituloEmba", tituloTablaEmba);
                                var numPag = Number(data.p_totalpag) + 1;
                                var paginas = [];
                                for (let index = 1; index < numPag; index++) {
                                    paginas.push({
                                        numero: index
                                    });
                                }
                                this.getOwnerComponent().getModel("ComboModel").setProperty("/NumerosPaginacion", paginas);
                                sap.ui.getCore().byId("comboPaginacion").setSelectedKey("1");
                                this.currentPage = "1";
                                this.lastPage = data.p_totalpag;
                            } else {
                                var tituloTablaEmba = "Página 1/1";
                                this.getOwnerComponent().getModel("ComboModel").setProperty("/TituloEmba", tituloTablaEmba);
                                this.getOwnerComponent().getModel("ComboModel").setProperty("/NumerosPaginacion", []);
                                sap.ui.getCore().byId("goFirstPag").setEnabled(false);
                                sap.ui.getCore().byId("goPreviousPag").setEnabled(false);
                                sap.ui.getCore().byId("comboPaginacion").setEnabled(false);
                                sap.ui.getCore().byId("goLastPag").setEnabled(false);
                                sap.ui.getCore().byId("goNextPag").setEnabled(false);
                                this.currentPage = "1";
                                this.lastPage = data.p_totalpag;
                            }
                        }


                        //sap.ui.getCore().byId("comboPaginacion").setVisible(true);

                        BusyIndicator.hide();
                    }).catch(error => console.log(error));
            },

            onChangePag: function () {
                var id = evt.getSource().getId();
                var oControl = sap.ui.getCore().byId(id);
                var pagina = oControl.getSelectedKey();
                this.currentPage = pagina;
                this.onNavPage();
            },

            onSetCurrentPage: function (evt) {
                var id = evt.getSource().getId();
                if (id == "goFirstPag") {
                    this.currentPage = "1";
                } else if (id == "goPreviousPag") {
                    if (!isNaN(this.currentPage)) {
                        if (this.currentPage != "1") {
                            var previousPage = Number(this.currentPage) - 1;
                            this.currentPage = previousPage.toString();
                        }
                    }
                } else if (id == "goNextPag") {
                    if (!isNaN(this.currentPage)) {
                        if (this.currentPage != this.lastPage) {
                            var nextPage = Number(this.currentPage) + 1;
                            this.currentPage = nextPage.toString();
                        }
                    }
                } else if (id == "goLastPag") {
                    this.currentPage = this.lastPage;
                }
                this.onNavPage();
            },

            onNavPage: function () {
                BusyIndicator.show(0);
                let embarcaciones = [];
                var body = {
                    "option": [

                    ],
                    "option2": [

                    ],
                    "options": this.primerOption,
                    "options2": this.segundoOption,
                    "p_user": "BUSQEMB",
                    "p_pag": this.currentPage
                };

                fetch(`${mainUrlServices}embarcacion/ConsultarEmbarcacion/`,
                    {
                        method: 'POST',
                        body: JSON.stringify(body)
                    })
                    .then(resp => resp.json()).then(data => {
                        console.log("Emba: ", data);
                        embarcaciones = data.data;

                        this.getOwnerComponent().getModel("ComboModel").setProperty("/Embarcaciones", embarcaciones);
                        this.getOwnerComponent().getModel("ComboModel").refresh();
                        var tituloTablaEmba = "Página " + this.currentPage + "/" + Number(data.p_totalpag);
                        this.getOwnerComponent().getModel("ComboModel").setProperty("/TituloEmba", tituloTablaEmba);
                        sap.ui.getCore().byId("comboPaginacion").setSelectedKey(this.currentPage);
                        BusyIndicator.hide();
                    }).catch(error => console.log(error));
            },

            onCerrarEmba: function () {
                this.clearFilterEmba();
                this.getEmbaDialog().close();
                this.getOwnerComponent().getModel("ComboModel").setProperty("/Embarcaciones", []);
                this.getOwnerComponent().getModel("ComboModel").setProperty("/TituloEmba", "");
                sap.ui.getCore().byId("comboPaginacion").setEnabled(false);
                sap.ui.getCore().byId("goFirstPag").setEnabled(false);
                sap.ui.getCore().byId("goPreviousPag").setEnabled(false);
                sap.ui.getCore().byId("comboPaginacion").setEnabled(false);
                sap.ui.getCore().byId("goLastPag").setEnabled(false);
                sap.ui.getCore().byId("goNextPag").setEnabled(false);
                sap.ui.getCore().byId("comboPaginacion").setSelectedKey("1");
            },

            verificarCambiosCodigo: async function (tipo, codigo, embarcacion) {
                //var form = this.getModel("Form");
                BusyIndicator.show(0);
                var modelo = this.getOwnerComponent().getModel("DetalleMarea");
                var bOk = null;
                if (codigo != null && codigo.trim().length > 0) {
                    codigo = codigo.trim();
                    if (tipo == "EMB") {
                        if (this.bckEmbarcacion == null || codigo != this.bckEmbarcacion) {
                            modelo.setProperty("/DatosGenerales/CDMMA", null);
                            bOk = await this.buscarEmbarcacion(codigo, embarcacion);
                        }
                    } else if (tipo == "ARM") {
                        if (this.bckArmador == null || codigo != this.bckArmador) {
                            bOk = await this.buscarArmador(codigo);
                        }
                    }
                }
                BusyIndicator.hide();
                return bOk;
            },

            buscarArmador: async function (codigo) {
                var clearData = false;
                //var dataSesionModel = this.getModel("DataSession");
                var modelo = this.getOwnerComponent().getModel("DetalleMarea");
                var usuario = this.getCurrentUser();
                var response = await TasaBackendService.buscarArmador(codigo, usuario);
                if (response) {
                    //var form = this.getModel("Form");
                    var data = response.data[0];
                    modelo.setProperty("/DatosGenerales/NAME1", data.DSEMP);
                } else {
                    var mssg = this.oBundle.getText("NORESULTADOARMADOR");
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
                var usuario = this.getCurrentUser();
                var valFijoPlanta = modelo.getProperty("/DatosGenerales/CDPTA");
                //visibleModel.setProperty("/EnlMarAnterior", false);
                //var emba = await TasaBackendService.buscarEmbarcacion(codigo, usuario);
                if (embarcacion) {
                    await this.obtenerDatosMareaAnt(0, codigo);
                    //var mareaAnterior = this.getModel("MareaAnterior");
                    //var estMarAnt = mareaAnterior.getProperty("/EstMarea");
                    var estMarAnt = modelo.getProperty("/MareaAnterior/ESMAR");
                    //var cieMarAnt = mareaAnterior.getProperty("/EstCierre");
                    var cieMarAnt = modelo.getProperty("/MareaAnterior/ESCMA");
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
                                var obtenerDatosDistribFlota = await this.obtenerDatosDistribFlota(codigo);
                                if (obtenerDatosDistribFlota) {
                                    clearData = !consultarPermisoZarpe;
                                } else {
                                    var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.oBundle.getText("NOUBICENDISTRIB");
                                    MessageBox.error(mssg);
                                    clearData = true;
                                }
                            } else if (indPropiedad == "T") {
                                var obtenerDatosPlantaDist = await this.obtenerDatosPlantaDist(valFijoPlanta);
                                if (obtenerDatosPlantaDist) {
                                    clearData = !consultarPermisoZarpe;
                                } else {
                                    var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.oBundle.getText("SELECCPLANTA");
                                    MessageBox.error(mssg);
                                    clearData = true;
                                }
                            } else {
                                var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.oBundle.getText("NOINDPROPIEDAD");
                                MessageBox.error(mssg);
                                clearData = true;
                            }

                            if (!clearData) {
                                var valPerPescSur = this.validarPermisoPescaSur();
                                clearData = !valPerPescSur;
                            }
                        } else {
                            var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.oBundle.getText("EMBNOPERATIVO");
                            MessageBox.error(mssg);
                            clearData = true;
                        }
                    } else if (estMarAnt == "A") {
                        if (!cieMarAnt) {
                            //visibleModel.setProperty("/EnlMarAnterior", true);
                            var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.oBundle.getText("EMBMAREAABIERTA");
                            console.log(mssg);
                            MessageBox.error(mssg);
                            clearData = true;
                        } else {
                            var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.oBundle.getText("MAREATRATADAADMIN");
                            MessageBox.error(mssg);
                            clearData = true;
                        }
                    }
                } else {
                    var mssg = this.oBundle.getText("NORESULTADOEMB");
                    MessageBox.information(mssg);
                    clearData = true;
                }
                if (clearData) {

                    this.bckEmbarcacion = null;
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
                    this.bckEmbarcacion = codigo;
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
                    //modelo.setProperty("/BtnArmador", true);//activar ayuda de bsuqeuda de armador
                    modelo.setProperty("/Config/visibleLinkCrearArmador", true);
                    modelo.setProperty("/Cabecera/CDEMP", null);
                    modelo.setProperty("/Cabecera/NAME1", null);
                    modelo.setProperty("/Cabecera/INPRP", "T");
                } else {//setArmLectura
                    //modelo.setProperty("/BtnArmador", false);//DESACTIVAR  ayuda de bsuqeuda de armador
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
                            var mssg = this.oBundle.getText("PERMISOSURVENCIO", [fechaPerSur]);
                            MessageBox.error(mssg);
                        }
                    } else {
                        bOk = false;
                        var mssg = this.oBundle.getText("NOPERMISOSUR");
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
                var usuario = this.getCurrentUser();
                //var distribFlota = this.getModel("DistribFlota");
                var distribFlota = modelo.getProperty("/DistribFlota");
                var constantsUtility = this.getModel("ConstantsUtility");
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
                        var mssg = this.oBundle.getText("PLANTASINEMPRESA");
                        MessageBox.error(mssg);
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    var mssg = this.oBundle.getText("NODATOSPLANTA");
                    MessageBox.error(mssg);
                    return false;
                }
            },

            obtenerDatosDistribFlota: async function (codigo) {
                //var me = this;
                var modelo = this.getOwnerComponent().getModel("DetalleMarea");
                //var dataSesionModel = this.getModel("DataSession");
                //var usuario = dataSesionModel.getProperty("/User");
                var usuario = this.getCurrentUser();
                //var distribFlota = this.getModel("DistribFlota");
                var distribFlota = modelo.getProperty("/DistribFlota");
                var constantsUtility = this.getModel("ConstantsUtility");
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
                        var mssg = this.oBundle.getText("PLANTASINEMPRESA");
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
                var usuario = this.getCurrentUser();
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
                var usuario = this.getCurrentUser();
                //var form = this.getModel("Form");
                var form = this.getOwnerComponent().getModel("DetalleMarea");
                var puedeZarpar = await TasaBackendService.obtenerPermisoZarpe(codigo, usuario).then(function (response) {
                    var bOk = true;
                    if (response.data) {
                        var permiso = response.data[0];
                        if (permiso.ESPMS != "V") {
                            form.setProperty("/Cabecera/CDEMP", null);
                            form.setProperty("/Cabecera/NAME1", null);
                            var mssg = codigo + " - " + ce_embaElement.NMEMB + ":" + this.oBundle.getText("EMBSUSPENDIDA");
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

            validarBodegaCert: async function (codEmba, codPlanta) {
                var bOk = false;
                var response = await TasaBackendService.validarBodegaCert(codEmba, codPlanta);
                if (response) {
                    bOk = response.estado;
                } else {
                    bOk = null;
                }
                return bOk;
            },

            ValidacionMareaProduce: async function (codEmba, codPlanta) {
                var bOk = false;
                var response1 = await TasaBackendService.validarMareaProd(codEmba, codPlanta);
                if (response1) {
                    if (response1.p_correcto == "X") {
                        bOk = true;
                    } else {
                        bOk = false;
                    }
                } else {
                    bOk = null;
                }
                return bOk;
            },

            validarRoles: function(){
                var modelo = this.getOwnerComponent().getModel("DetalleMarea");
                var rolesRadOpe = modelo.getProperty("/RolesFlota/RolRadOpe");
                var rolIngCOmb = modelo.getProperty("/RolesFlota/RolIngCom");
                var rolesUsuario = this.getRolUser();
                for (let index = 0; index < rolesUsuario.length; index++) {
                    const rol = rolesUsuario[index];
                    if(rolesRadOpe.includes(rol)){
                        modelo.setProperty("/DataSession/IsRolRadOpe", true);
                    }  
                    
                    if(rolIngCOmb.includes(rol)){
                        modelo.setProperty("/DataSession/IsRollngComb", true);
                    }
                }
                //modelo.setProperty("/DataSession/RolFlota", true);
            },

            onTest: function () {
                TasaBackendService.test().then(function (response) {
                    console.log("Response: ", response);
                }).catch(function (error) {
                    console.log("ERROR: DetalleMarea.onTest - ", error);
                });
            }

        });
    });
