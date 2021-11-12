sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "../Service/TasaBackendService",
    "../Formatter/formatter",
    "./Utils",
    "../model/models"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageBox, TasaBackendService, formatter, Utils, models) {
        "use strict";

        return Controller.extend("com.tasa.registroeventospescav2.controller.Main", {

            formatter: formatter,

            onInit: function () {
                var currentUser = this.getCurrentUser();
                this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                var me = this;
                TasaBackendService.obtenerTipoEmbarcacion(currentUser).then(function(tipoEmbarcacion){
                    TasaBackendService.obtenerPlantas(currentUser).then(function(plantas){
                        me.prepararDataTree(tipoEmbarcacion, plantas.data);//metodo para armar la data y setear el modelo del tree
                        TasaBackendService.cargarListaMareas(currentUser).then(function(mareas){
                            //console.log("Mareas: ", mareas);
                            me.validarDataMareas(mareas);
                        }).catch(function(error){
                            console.log("ERROR: Main.onInit - " + error);
                        });
                    }).catch(function(error){
                        console.log("ERROR: Main.onInit - " + error);
                    });
                }).catch(function(error){
                    console.log("ERROR: Main.onInit - " + error);
                });
                this.CDTEM = "";
                this.CDPTA = "";
                //this.filtarMareas("001","0012");//por defecto muestra la primera opcion

            },

            _onPatternMatched: function () {

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

            validarDataMareas: function(sData){
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
                var tmpPropios = Utils.removeDuplicateArray(propios, it => it.NRMAR);
                var tmpTerceros = Utils.removeDuplicateArray(terceros, it => it.NRMAR);
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
                var totalPescaDeclarada = 0;

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

                        //validar descripcion link
                        if(tmpElement.ESMAR == "C" || tmpElement.CDEED == "010" || (tmpElement.ESMAR == "A" && tmpElement.ESCMA != "")){
                            tmpElement.DESCLINK = "Crear"
                        }else{
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
                        if(tmpElement1.ESMAR == "C" || tmpElement1.CDEED == "010" || (tmpElement1.ESMAR == "A" && tmpElement1.ESCMA != "")){
                            tmpElement1.DESCLINK = "Crear"
                        }else{
                            tmpElement1.DESCLINK = "Editar"
                        }

                        dataTerceros.push(tmpElement1);
                    }
                }
                var modeloMareaTerceros = new JSONModel(dataTerceros);
                this.getView().byId("tblMareasTerceros").setModel(modeloMareaTerceros);
                this.getView().byId("itfTerceros").setCount(dataTerceros.length);

                //setear header para total de pesca declarada
                this.getView().byId("idObjectHeader").setNumber(totalPescaDeclarada);
                this.getView().byId("idIconTabBar").setSelectedKey("itfPropios");
            },

            onNavToDetailMaster: function () {

            },

            onActualizaMareas: function () {
                var me = this;
                var currentUser = me.getCurrentUser();
                if (me.CDTEM && me.CDPTA) {
                    TasaBackendService.cargarListaMareas(currentUser).then(function(mareas){
                        me.validarDataMareas(mareas);
                        me.filtarMareas(me.CDTEM, me.CDPTA);
                    }).catch(function(error){
                        console.log("ERROR: Main.onActualizaMareas - " + error);
                    });
                } else {
                    MessageBox.information(this.oBundle.getText("ERRORSLECCIONEPLANTA"));
                }
            },

            onNuevaMarea: function () {
                //abrir poup
                var me = this;
                var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
                var dataDetalleMarea = modeloDetalleMarea.getData();
                var currentUser = this.getCurrentUser();
                TasaBackendService.obtenerPlantas(currentUser).then(function(plantas){
                    dataDetalleMarea.Config.datosCombo.Plantas = plantas.data; // cargar combo plantas nueva marea
                    modeloDetalleMarea.refresh();
                }).catch(function(error){
                    console.log("ERROR: Main.onInit - " + error);
                });
                me.getDialog().open();
            },

            onCancelMarea: function () {
                this.getDialog().close();
            },

            onCrearMarea: function () {
                var me = this;
                this.getDialog().close();
                var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
                modeloDetalleMarea.refresh();
                var dataDetalleMarea = modeloDetalleMarea.getData();
                var embarcacion = dataDetalleMarea.FormNewMarea.Planta;
                var embaDesc = dataDetalleMarea.FormNewMarea.EmbarcacionDesc
                var planta = dataDetalleMarea.FormNewMarea.Embarcacion;
                console.log(modeloDetalleMarea);
                if(embarcacion && planta){
                    var bOk = me.validaBodMar(embarcacion, planta, embaDesc);
                    if(!bOk){
                        me.getOwnerComponent().setModel(models.createInitModel(), "DetalleMarea");
                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("DetalleMarea");
                    }
                }else{
                    MessageBox.information(this.oBundle.getText("NEWMAREAMISSFIELD"));
                }
            },

            onEditarCrearMarea: function (evt) {
                var selectedItem = evt.getSource().getParent().getBindingContext().getObject();
                var me = this;
                if(selectedItem){
                    var currentUser = this.getCurrentUser();
                    if(selectedItem.ESMAR == "A"){
                        TasaBackendService.obtenerDetalleMarea(selectedItem.NRMAR, currentUser).then(function(response){
                            if(response){
                                me.setDetalleMarea(response);
                            }
                        }).catch(function(error){
                            console.log("ERROR: Main.onEditarCrearMarea - " + error);
                        });
                    }else{
                        var bOk = this.validaBodMar(selectedItem.CDEMB, selectedItem.CDPTA, selectedItem.NMEMB);
                        if(bOk){
                            me.preparaFormulario();
                        }
                    }
                    
                }else{
                    console.log("ERROR: Main.onEditarCrearMarea - " + this.oBundle.getText("ERRORITEMSELECCIONADO"));
                }
            },

            validaBodMar: async function(cdemb, cdpta, nmemb){
                var bOk = false;
                var me = this;
                TasaBackendService.validarBodegaCert(cdemb, cdpta).then(function(response){
                    if(response.estado){
                        TasaBackendService.validarMareaProd(cdemb, cdpta).then(function(response){
                            if(response.p_correcto == "X"){
                                bOk = true;
                            }else{
                                MessageBox.error(me.oBundle.getText("EMBANOPROD", [nmemb]));
                            }
                        }).catch(function(error){
                            console.log("ERROR: Main.onEditarCrearMarea - " + error);
                        });
                    }else{
                        MessageBox.error(me.oBundle.getText("EMBANOPER", [nmemb]));
                    }
                }).catch(function(error){
                    console.log("ERROR: Main.onEditarCrearMarea - " + error);
                });
                return bOk;
            },

            setDetalleMarea: function(data){
                var me = this;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var modeloDetalleMarea = me.getOwnerComponent().getModel("DetalleMarea");
                var dataDetalleMarea = modeloDetalleMarea.getData();
                var marea = data.s_marea[0];
                var eventos = data.s_evento;

                //setear cabecera de formulario
                var cabecera = dataDetalleMarea.Cabecera;
                for(var keyC in cabecera){
                    if(marea.hasOwnProperty(keyC)){
                        cabecera[keyC] = marea[keyC];
                    }
                }

                //setear pestania datos generales
                var datsoGenerales = dataDetalleMarea.DatosGenerales;
                for(var keyC in datsoGenerales){
                    if(marea.hasOwnProperty(keyC)){
                        datsoGenerales[keyC] = marea[keyC];
                    }
                }

                //setear lista de eventos
                dataDetalleMarea.Eventos.TituloEventos = "Eventos (" + eventos.length + ")";

                //setear desc eventos
                /*TasaBackendService.obtenerDominio("ZCDTEV").then(function(response){
                    var sData = response.data[0].data;
                    for (let index = 0; index < eventos.length; index++) {
                        const element = eventos[index];
                        var desc = "";
                        for (let index1 = 0; index1 < sData.length; index1++) {
                            const element1 = sData[index1];
                            if(element.CDTEV == element1.id){
                                desc = element1.descripcion;
                                break;
                            }
                        }
                        element.DESCEVT = desc; 
                    }
                    dataDetalleMarea.Eventos.Lista = eventos;
                }).catch(function(error){
                    console.log("ERROR: DetalleMarea.cargarCombos - ", error );
                });*/
                dataDetalleMarea.Eventos.Lista = eventos;

                //la pestania de reserva de combustible y venta de combustible se setean en el Detalle

                //setear config inicial
                dataDetalleMarea.Config.visibleLinkSelecArmador = false;
                dataDetalleMarea.Config.visibleArmadorRuc = false;
                dataDetalleMarea.Config.visibleArmadorRazon = false;
                dataDetalleMarea.Config.visibleArmadorCalle = false;
                dataDetalleMarea.Config.visibleArmadorDistrito = false;
                dataDetalleMarea.Config.visibleArmadorProvincia = false;
                dataDetalleMarea.Config.visibleArmadorDepartamento = false;

                //refrescar modelo y navegar al detalle
                modeloDetalleMarea.refresh();
                oRouter.navTo("DetalleMarea");
            },

            preparaFormulario: function(){
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

            getDialog: function () {
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment("com.tasa.registroeventospescav2.view.fragments.NuevaMarea", this);
                    this.getView().addDependent(this.oDialog);
                }
                return this.oDialog;
            },

            onSelectTab: function(evt){
                var key = evt.getParameters("key").selectedKey;
                var totalPescaDeclarada = 0;
                var modelo = null;
                if (key.includes("itfPropios")) {
                    modelo = this.getView().byId("tblMareasPropios").getModel();
                }

                if (key.includes("itfTerceros")) {
                    modelo = this.getView().byId("tblMareasTerceros").getModel();
                }

                if(modelo){
                    var data = modelo.getData();
                    if (data.length > 0) {
                        for (let index = 0; index < data.length; index++) {
                            const element = data[index];
                            totalPescaDeclarada += element.CNPCM;
                        }
                    }
                }else{
                    MessageBox.error(this.oBundle.getText("ERRORSELECPESTANIA"));
                }

                this.getView().byId("idObjectHeader").setNumber(totalPescaDeclarada);
            },

            onTest: function(){
                TasaBackendService.test().then(function(response){
                    console.log("Response: ", response);
                }).catch(function(error){
                    console.log("ERROR: DetalleMarea.onTest - ", error );
                });
            }
            
        });
    });
