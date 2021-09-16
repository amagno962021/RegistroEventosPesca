sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageBox) {
        "use strict";

        return Controller.extend("com.tasa.registroeventospescav2.controller.Main", {
            onInit: function () {
                /*this.router = this.getView().getRouter(this);
                this.router.getRoute("RouteMain").attachPatternMatched(this._onPatternMatched, this);*/
                var currentUser = this.getCurrentUser();
                this.consultaTipoEmbarcacion(currentUser);
                //this.prepararDataTree();
                this.CDTEM = "";
                this.CDPTA = "";
                //this.filtarMareas("001","0012");//por defecto muestra la primera opcion
            },

            _onPatternMatched: function () {

            },

            prepararDataTree: function (dataTipoEmba, dataPlantas) {
                //preparar data del tree
                /*var modeloTipoEmbarcacion = this.getView().getModel("TipoEmbarcacion");
                var modeloPlantas = this.getView().getModel("Plantas");
                var dataTipoEmba = modeloTipoEmbarcacion.getData();
                var dataPlantas = modeloPlantas.getData().data;*/
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
                //this.getView().byId("idTreeEmbarcacion").setModel(modelTree);
                this.getView().byId("navigationList").setModel(modelTree);

                //bindeo al navigation list
                /*var subNavList = new sap.tnt.NavigationList({text: "{text}", icon: "{ref}"});
                var navList = new sap.tnt.NavigationList*/

            },

            onSearchMarea: function (evt) {
                //console.log(evt)
                var selectedItem = evt.getParameter("item").getBindingContext().getObject();
                console.log(selectedItem);
                if (selectedItem.cdtem && selectedItem.cdpta) {
                    var oGlobalBusyDialog = new sap.m.BusyDialog();
                    var cdtem = selectedItem.cdtem;
                    var cdpta = selectedItem.cdpta;
                    var txtCabecera = selectedItem.text + " - " + selectedItem.descr;
                    this.getView().byId("idObjectHeader").setTitle(txtCabecera);
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

                //filtrar propios
                for (let index = 0; index < dataModeloPropios.length; index++) {
                    const element = dataModeloPropios[index];
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
                        dataTerceros.push(tmpElement1);
                    }
                }
                var modeloMareaTerceros = new JSONModel(dataTerceros);
                this.getView().byId("tblMareasTerceros").setModel(modeloMareaTerceros);
                this.getView().byId("itfTerceros").setCount(dataTerceros.length);

            },

            onNavToDetailMaster: function () {

            },

            onActualizaMareas: function () {
                if (this.CDTEM && this.CDPTA) {
                    var that = this;
                    var oGlobalBusyDialog = new sap.m.BusyDialog();
                    var host = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
                    var path = "/api/embarcacion/ObtenerFlota?";
                    var query = "user=" + that.getCurrentUser();
                    var sUrl = host + path + query;
                    oGlobalBusyDialog.open();
                    $.ajax({
                        url: sUrl,
                        type: 'GET',
                        cache: false,
                        async: false,
                        dataType: 'json',
                        beforeSend: function () {
                            //oGlobalBusyDialog.open();
                        },
                        success: function (data, textStatus, jqXHR) {
                            var sData = JSON.parse(data);
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
                            that.getView().getModel("Propios").setData(propios);
                            that.getView().getModel("Terceros").setData(terceros);
                            that.getView().getModel("Propios").refresh();
                            that.getView().getModel("Terceros").refresh();
                            that.filtarMareas(that.CDTEM, that.CDPTA);
                            oGlobalBusyDialog.close();
                        },
                        error: function (xhr, readyState) {
                            console.log(xhr);
                        }
                    });
                } else {
                    MessageBox.information("Seleccione una planta para actualizar las mareas.");
                }
            },

            onNuevaMarea: function () {
                //abrir poup
                this.getDialog().open();

            },

            onCancelMarea: function () {
                this.getDialog().close();
            },

            onCrearMarea: function () {
                this.getDialog().close();
            },

            onEditarCrearMarea: function (evt) {
                var selectedItem = evt.getSource().getParent().getBindingContext().getObject();
                console.log(selectedItem);
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var that = this;
                var oGlobalBusyDialog = new sap.m.BusyDialog();
                var host = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
                var path = "/api/embarcacion/consultaMarea/";
                var sUrl = host + path;
                var sBody = {
                    "fieldEvento": [
                    ],
                    "fieldFLBSP": [
                    ],
                    "fieldMarea": [
                    ],
                    "fieldPSCINC": [
                    ],
                    "p_embarcacion": "",
                    "p_flag": "",
                    "p_marea": selectedItem.NRMAR,
                    "user": this.getCurrentUser()
                };
                $.ajax({
                    url: sUrl,
                    type: 'POST',
                    cache: false,
                    async: true,
                    data: JSON.stringify(sBody),
                    dataType: 'json',
                    beforeSend: function () {
                        oGlobalBusyDialog.open();
                    },
                    success: function (data, textStatus, jqXHR) {
                        //var sData = JSON.parse(data);
                        var marea = data.s_marea[0];
                        var eventos = data.s_evento;
                        console.log("Eventos: ", eventos);
                        var detalleMarea = {
                            Cabecera: {},
                            DatosGenerales: {},
                            Eventos: {},
                            ResCombustible: {},
                            VentaCombustible: {},
                            Config: {}
                        };

                        var tmpCabecera = {
                            NRMAR: marea.NRMAR,
                            CDMMA: that.getDominio("ZDO_ZCDMMA", marea.CDMMA),
                            OBMAR: marea.OBMAR,
                            CDEMB: marea.CDEMB,
                            NMEMB: marea.NMEMB,
                            MREMB: marea.MREMB,
                            CDEMP: marea.CDEMP,
                            NAME1: marea.NAME1
                        };
                        detalleMarea.Cabecera = tmpCabecera;

                        var tmpDatosGenerales = {
                            CDEMB: marea.CDEMB,
                            NMEMB: marea.NMEMB,
                            CDEMP: marea.CDEMP,
                            NAME1: marea.NAME1,
                            CDSPE: marea.CDSPE,
                            DSSPE: marea.DSSPE,
                            CDMMA: marea.CDMMA,
                            INUBC: marea.INUBC,
                            ESMAR: marea.ESMAR,
                            FEARR: marea.FEARR,
                            FIMAR: marea.FIMAR,
                            FFMAR: marea.FFMAR,
                            NuevoArmador: {
                                RUC: "",
                                RAZON: "",
                                CALLE: "",
                                DISTRITO: "",
                                PROVINCIA: "",
                                DEPARTAMENTO: ""
                            }
                        };
                        detalleMarea.DatosGenerales = tmpDatosGenerales;

                        var tmpEventos = {
                            TituloEventos: "Eventos ("+ eventos.length + ")",
                            Lista: eventos
                        };
                        detalleMarea.Eventos = tmpEventos;





                        var tmpConfig = {
                            visibleArmadorComercial: true,
                            visibleLinkCrearArmador: true,
                            visibleLinkSelecArmador: false,
                            visibleArmadorRuc: false,
                            visibleArmadorRazon: false,
                            visibleArmadorCalle: false,
                            visibleArmadorDistrito: false,
                            visibleArmadorProvincia: false,
                            visibleArmadorDepartamento: false,
                            visibleMotMarea: true,
                            visibleUbiPesca: true,
                            visibleEstMarea: true,
                            visibleFecHoEta: true,
                            visibleFechIni: true,
                            visibleFechFin: true,
                            datosCombo: {
                                Departamentos: that.getDepartamentos(),
                                MotivosMarea: that.getMotivosMarea(marea.INPRP),
                                UbicPesca: that.getUbicPesca(),
                                EstMar: that.getEstMar()
                            }
                        };
                        detalleMarea.Config = tmpConfig;




                        that.getOwnerComponent().getModel("DetalleMarea").setData(detalleMarea);
                        that.getOwnerComponent().getModel("DetalleMarea").refresh();
                        oGlobalBusyDialog.close();
                        oRouter.navTo("DetalleMarea");
                    },
                    complete: function () {
                        oGlobalBusyDialog.close();
                    },
                    error: function (xhr, readyState) {
                        console.log(xhr);
                        oGlobalBusyDialog.close();
                    }
                });
            },

            consultaTipoEmbarcacion: function (user) {
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
                    beforeSend: function () {
                        oGlobalBusyDialog.open();
                    },
                    success: function (data, textStatus, jqXHR) {
                        //that.getModel("TipoEmbarcacion").attachRequestCompleted(function(oEvent) { console.log(oEvent.getSource().getData()); });
                        /*var jsonModel = new JSONModel(JSON.parse(data));
                        that.getView().setModel(jsonModel, "TipoEmbarcacion");
                        that.getView().getModel("TipoEmbarcacion").refresh();*/
                        that.consultaPlantas(user, JSON.parse(data));
                        //oGlobalBusyDialog.close();
                    },
                    complete: function () {
                        oGlobalBusyDialog.close();
                    },
                    error: function (xhr, readyState) {
                        console.log(xhr);
                    }
                });
            },

            consultaPlantas: function (user, dataTipoEmba) {
                var that = this;
                var oGlobalBusyDialog = new sap.m.BusyDialog();
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
                    beforeSend: function () {
                        oGlobalBusyDialog.open();
                    },
                    success: function (data, textStatus, jqXHR) {
                        /*var jsonModel = new JSONModel(JSON.parse(data));
                        that.getView().setModel(jsonModel, "Plantas");
                        that.getView().getModel("Plantas").refresh();*/
                        var dataPlantas = JSON.parse(data);
                        that.prepararDataTree(dataTipoEmba, dataPlantas.data);
                        that.cargaMareas(user);
                        //oGlobalBusyDialog.close();
                    },
                    complete: function () {
                        oGlobalBusyDialog.close();
                    },
                    error: function (xhr, readyState) {
                        console.log(xhr);
                    }
                });
            },

            cargaMareas: function (usuario) {
                var that = this;
                var oGlobalBusyDialog = new sap.m.BusyDialog();
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
                    beforeSend: function () {
                        //oGlobalBusyDialog.open();
                    },
                    success: function (data, textStatus, jqXHR) {
                        var sData = JSON.parse(data);
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
                        var jsonModelPropios = new JSONModel(propios);
                        var jsonModelTerceros = new JSONModel(terceros);
                        that.getView().setModel(jsonModelPropios, "Propios");
                        that.getView().setModel(jsonModelTerceros, "Terceros");
                        that.getView().getModel("Propios").refresh();
                        that.getView().getModel("Terceros").refresh();
                        //oGlobalBusyDialog.close();
                    },
                    complete: function () {
                        oGlobalBusyDialog.close();
                    },
                    error: function (xhr, readyState) {
                        console.log(xhr);
                    }
                });

            },

            getCurrentUser: function () {
                return "fgarcia";
            },

            formatDate: function (date) {
                var d = new Date(date),
                    month = '' + (d.getMonth() + 1),
                    day = '' + (d.getDate() + 1),
                    year = d.getFullYear();

                if (month.length < 2)
                    month = '0' + month;
                if (day.length < 2)
                    day = '0' + day;

                return [day, month, year].join('/');
            },

            getDialog: function () {
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment("com.tasa.registroeventospescav2.view.fragments.NuevaMarea", this);
                    this.getView().addDependent(this.oDialog);
                }
                return this.oDialog;
            },

            getDominio: function (dominio, key) {
                var that = this;
                var oVal = null;
                var oGlobalBusyDialog = new sap.m.BusyDialog();
                var host = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
                var path = "/api/dominios/Listar";
                var sUrl = host + path;
                var sBody = {
                    "dominios": [
                        {
                            "domname": dominio,
                            "status": "A"
                        }
                    ]
                };
                $.ajax({
                    url: sUrl,
                    type: 'POST',
                    cache: false,
                    async: false,
                    data: JSON.stringify(sBody),
                    dataType: 'json',
                    beforeSend: function () {
                        oGlobalBusyDialog.open();
                    },
                    success: function (data, textStatus, jqXHR) {
                        //var sData = JSON.parse(data);
                        var sData = data.data[0].data;
                        for (let index = 0; index < sData.length; index++) {
                            const element = sData[index];
                            if (element.id == key) {
                                oVal = element.descripcion;
                                break;
                            }
                        }
                        //oGlobalBusyDialog.close();
                    },
                    complete: function () {
                        oGlobalBusyDialog.close();
                    },
                    error: function (xhr, readyState) {
                        console.log(xhr);
                    }
                });
                return oVal;
            },

            getDepartamentos: function () {
                var that = this;
                var oGlobalBusyDialog = new sap.m.BusyDialog();
                var host = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
                var path = "/api/General/Read_Table/";
                var sUrl = host + path;
                var departamentos = [];
                var sBody = {
                    "delimitador": "|",
                    "fields": [
                        "BLAND",
                        "BEZEI"
                    ],
                    "no_data": "",
                    "option": [
                        {
                            "wa": "SPRAS EQ 'ES' AND LAND1 EQ 'PE'"
                        }
                    ],
                    "options": [
                        {
                            "cantidad": "",
                            "control": "",
                            "key": "",
                            "valueHigh": "",
                            "valueLow": ""
                        }
                    ],
                    "order": "",
                    "p_user": this.getCurrentUser(),
                    "rowcount": 0,
                    "rowskips": 0,
                    "tabla": "T005U"
                };
                $.ajax({
                    url: sUrl,
                    type: 'POST',
                    cache: false,
                    async: false,
                    data: JSON.stringify(sBody),
                    dataType: 'json',
                    beforeSend: function () {
                        oGlobalBusyDialog.open();
                    },
                    success: function (data, textStatus, jqXHR) {
                        var sData = data.data;
                        if (sData.length > 0) {
                            departamentos = sData;
                        }
                    },
                    complete: function () {
                        oGlobalBusyDialog.close();
                    },
                    error: function (xhr, readyState) {
                        console.log(xhr);
                        oGlobalBusyDialog.close();
                    }
                });
                return departamentos;
            },

            getMotivosMarea: function (indProp) {
                var that = this;
                var MotivosMarea = [];
                var oGlobalBusyDialog = new sap.m.BusyDialog();
                var host = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
                var path = "/api/dominios/Listar";
                var sUrl = host + path;
                var sBody = {
                    "dominios": [
                        {
                            "domname": "ZDO_ZCDMMA",
                            "status": "A"
                        }
                    ]
                };
                $.ajax({
                    url: sUrl,
                    type: 'POST',
                    cache: false,
                    async: false,
                    data: JSON.stringify(sBody),
                    dataType: 'json',
                    beforeSend: function () {
                        oGlobalBusyDialog.open();
                    },
                    success: function (data, textStatus, jqXHR) {
                        //var sData = JSON.parse(data);
                        if (indProp) {
                            if (indProp == "P") {
                                MotivosMarea = data.data[0].data;
                            } else {
                                var sData = data.data[0].data;
                                for (let index = 0; index < sData.length; index++) {
                                    const element = sData[index];
                                    //Motivos de marea con pesca (descargas)
                                    if (element.id == "1" || element.id == "2") {
                                        MotivosMarea.push(element);
                                    }
                                }
                            }
                        }
                        //oGlobalBusyDialog.close();
                    },
                    complete: function () {
                        oGlobalBusyDialog.close();
                    },
                    error: function (xhr, readyState) {
                        console.log(xhr);
                    }
                });
                return MotivosMarea;
            },

            getUbicPesca: function () {
                var that = this;
                var oVal = [];
                var oGlobalBusyDialog = new sap.m.BusyDialog();
                var host = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
                var path = "/api/dominios/Listar";
                var sUrl = host + path;
                var sBody = {
                    "dominios": [
                        {
                            "domname": "ZUBIC",
                            "status": "A"
                        }
                    ]
                };
                $.ajax({
                    url: sUrl,
                    type: 'POST',
                    cache: false,
                    async: false,
                    data: JSON.stringify(sBody),
                    dataType: 'json',
                    beforeSend: function () {
                        oGlobalBusyDialog.open();
                    },
                    success: function (data, textStatus, jqXHR) {
                        //var sData = JSON.parse(data);
                        oVal = data.data[0].data;
                        //oGlobalBusyDialog.close();
                    },
                    complete: function () {
                        oGlobalBusyDialog.close();
                    },
                    error: function (xhr, readyState) {
                        console.log(xhr);
                    }
                });
                return oVal;
            },

            getEstMar: function(){
                var that = this;
                var oVal = [];
                var oGlobalBusyDialog = new sap.m.BusyDialog();
                var host = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
                var path = "/api/dominios/Listar";
                var sUrl = host + path;
                var sBody = {
                    "dominios": [
                        {
                            "domname": "ZESTMAR",
                            "status": "A"
                        }
                    ]
                };
                $.ajax({
                    url: sUrl,
                    type: 'POST',
                    cache: false,
                    async: false,
                    data: JSON.stringify(sBody),
                    dataType: 'json',
                    beforeSend: function () {
                        oGlobalBusyDialog.open();
                    },
                    success: function (data, textStatus, jqXHR) {
                        //var sData = JSON.parse(data);
                        oVal = data.data[0].data;
                        //oGlobalBusyDialog.close();
                    },
                    complete: function () {
                        oGlobalBusyDialog.close();
                    },
                    error: function (xhr, readyState) {
                        console.log(xhr);
                    }
                });
                return oVal;
            }


        });
    });
