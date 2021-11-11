sap.ui.define([
    "../Service/TasaBackendService",
    'sap/ui/model/FilterOperator',
    'sap/ui/model/Filter',
    "sap/ui/core/syncStyleClass",
    'sap/ui/core/Fragment',
    "sap/ui/base/ManagedObject",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/integration/library",
    "../model/textValidaciones",
    "sap/m/MessageBox",
    "./General",
    "./Horometro",
    "./PescaDeclarada",
    "./Siniestro"
], function (
    TasaBackendService,
    FilterOperator,
    Filter,
    syncStyleClass,
    Fragment,
    ManagedObject,
    JSONModel,
    MessageToast,
    integrationLibrary,
    textValidaciones,
    MessageBox,
    General,
    Horometro,
    PescaDeclarada,
    Siniestro
) {
    "use strict";

    return ManagedObject.extend("com.tasa.registroeventospescav2.controller.PescaDescargada", {

        constructor: function (oView, sFragName,o_this) {

            this._oView = oView;
            this._oControl = sap.ui.xmlfragment(oView.getId(), "com.tasa.registroeventospescav2.fragments." + sFragName, this);
            this._bInit = false;
            this._DataPopup;
            this._controler = o_this;
            this._modelosPescaDescargada = {"ListaDescargas":[]}

            var Popup_Descarga_Modelo = new JSONModel();
            this._oView.setModel(Popup_Descarga_Modelo, "popup_descarga");
            Popup_Descarga_Modelo.setData(this._modelosPescaDescargada);

        },
        onButtonPress3: function (o_event) {
            console.log(o_event);
        },

        getcontrol: function () {
            return this._oControl;
        },

        validarBodegas: function () {
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            var bOk = true;
            var bodegas = this._controler._listaEventos[this._controler._elementAct].ListaBodegas;
            var cantTotal = 0;
            var mensaje = "";
            for (let index = 0; index < bodegas.length; index++) {
                const element = bodegas[index];
                var cantPesca = element.CantPesca;
                var capaMaxim = element.CAPES;
                if (cantPesca) {
                    cantTotal += cantPesca;
                    if (cantPesca > capaMaxim) {
                        bOk = false;
                        mensaje = this.oBundle.getText("CAPABODEGASUPER");
                        MessageBox.error(mensaje);
                        break;
                    }
                }
            }

            if (bOk) {
                if (cantTotal == 0) {
                    bOk = false;
                    mensaje = this.oBundle.getText("CANTTOTBODNOCERO");
                    MessageBox.error(mensaje);
                }
            }

            return bOk;
        },

        validarBodegaPesca: function (verMensaje) {
            var bOk = true;
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            var eventoActual = this._controler._listaEventos[this._controler._elementAct];
            var cantPesca = eventoActual.ListaPescaDeclarada.length;
            var cantTotBod = eventoActual.CantTotalPescDecla;
            if ((cantTotBod > 1 && cantPesca == 0) || (cantTotBod == 0 && cantPesca > 0)) {
                if (cantPesca > 0) {
                    if (!this.oApproveDialog) {
                        this.oApproveDialog = new Dialog({
                            type: DialogType.Message,
                            title: "Confirm",
                            content: new Text({ text: "Do you want to submit this order?" }),
                            beginButton: new Button({
                                type: ButtonType.Emphasized,
                                text: "Submit",
                                press: function () {
                                    this.eliminarPescaDeclarada();
                                    MessageToast.show("Submit pressed!");
                                    this.oApproveDialog.close();
                                }.bind(this)
                            }),
                            endButton: new Button({
                                text: "Cancel",
                                press: function () {
                                    this.oApproveDialog.close();
                                }.bind(this)
                            })
                        });
                    }

                    this.oApproveDialog.open();
                } else {
                    mensaje = this.oBundle.getText("BODDECPESCANODEC");
                    MessageBox.error(mensaje);
                }
                bOk = false;
            }
            return bOk;
        },

        eliminarPescaDeclarada: function () {
            var eventoActual = this._controler._listaEventos[this._controler._elementAct];
            var pescaDeclarada = eventoActual.ListaPescaDeclarada;
            var ePescaDeclarada = eventoActual.eListaPescaDeclarada;
            for (let index = 0; index < pescaDeclarada.length; index++) {
                const element = pescaDeclarada[index];
                if (element.indicador == "E") {
                    var ePescaDeclarada = {
                        CDSPC: element.CDSPC
                    };
                    ePescaDeclarada.push(ePescaDeclarada);
                }
            }
            eventoActual.ObseAdicional = null;
            eventoActual.Observacion = null;
            pescaDeclarada = [];
            //refrescar modelo
        },

        validarDatosEvento: function(){
            var DetalleMarea = this._controler._FormMarea;//modelo detalle marea
            var soloLectura = this._controler._soloLectura;//modelo data session
            var tieneErrores = DetalleMarea.TieneErrores;//modelo detalle marea
            var listaEventos = this._controler._listaEventos;
            var eventoActual = this._controler._listaEventos[this._controler._elementAct];//modelo evento actual
            var visible = textValidaciones.visible;//modelo visible
            var motivoEnCalend = ["1", "2", "8"];//motivos de marea con registros en calendario

            if(!soloLectura && !tieneErrores){
                var tipoEvento = eventoActual.TipoEvento;
                var motMarea = this._controler._motivoMarea
                var bOk = this._controler.Dat_General.validarCamposGeneral(true);
                var eveActual = this._controler._elementAct;
                var cantEventos = listaEventos.length;
                if(bOk && visible.TabHorometro){
                    bOk = this._controler.Dat_Horometro.validarLecturaHorometros();
                    if(bOk){
                        bOk = this._controler.Dat_Horometro.validarHorometrosEvento();
                    }
                }

                if(bOk && tipoEvento == "6" && motivoEnCalend.includes(motMarea)){
                    visible.VisibleDescarga = false;
                    visible.FechFin = false;
                    var fechIni = eventoActual.FechIni;
                    bOk = this._controler.Dat_General.verificarTemporada(motMarea, fechIni);
                }

                if(bOk && tipoEvento == "3"){
                    visible.VisibleDescarga = true;
                    bOk = this._controler.Dat_PescaDeclarada.validarPescaDeclarada(true);
                    if(bOk && motMarea == "1"){
                        this._controler.Dat_Horometro.calcularCantTotalBodegaEve();
                        bOk = this.validarBodegas();
                        if(bOk){
                            bOk = this.validarBodegaPesca(true)();
                        }
                        if(bOk){
                            bOk = this._controler.Dat_PescaDeclarada.validarPorcPesca();
                        }
                        this._controler.Dat_PescaDeclarada.calcularPescaDeclarada();
                    } else if(bOk && motMarea == "2"){
                        this._controler.Dat_PescaDeclarada.calcularCantTotalPescDeclEve();
                    }
                    if(bOk){
                        this._controler.Dat_PescaDeclarada.validarCantidadTotalPesca();
                    }
                    if(bOk){
                        bOk = this._controler.Dat_General.validarIncidental();
                        if(bOk){
                            this.cargarIncidental();
                        }
                    }

                    if(eventoActual.CantTotalPescDecla){
                        eventoActual.CantTotalPescDeclaM = eventoActual.CantTotalPescDecla;
                    }else{
                        eventoActual.CantTotalPescDeclaM = null;
                    }

                    if(eveActual < cantEventos){
                        var cantTotalDec = eventoActual.CantTotalPescDecla;
                        var cantTotalDecDesc = 0;
                        for (let index = (eveActual + 1); index < cantEventos; index++) {
                            const element = listaEventos[index];
                            if(element.TipoEvento == "3"){
                                visible.VisibleDescarga = false;
                                cantTotalDec += element.CantTotalPescDecla;
                            } else if(element.TipoEvento == "5"){
                                visible.VisibleDescarga = false;
                                if (index == (cantEventos - 1)) {
                                    if(cantTotalDec < 0 || cantTotalDec == 0){
                                        element.MotiNoPesca = "7";
                                        element.Editado = true;
                                        // falta mensaje
                                        mensaje = this.oBundle.getText("EVEARRCAMBMOTNOPES");
                                        MessageBox.error(mensaje);
                                    }
                                } else {
                                    element.MotiNoPesca = null;
                                    element.Editado = true;
                                }
                            } else if(element.TipoEvento == "6"){
                                visible.VisibleDescarga = false;
                                visible.FechFin = false;
                                if(cantTotalDec < 0 || cantTotalDec == 0){
                                    bOk = false;
                                    //falta mesaje
                                    mensaje = this.oBundle.getText("EXIEVEDESCPESDECNOVAL");
                                    MessageBox.error(mensaje);
                                    break;
                                } else {
                                    if(element.ListaPescaDescargada[0].CantPescaDeclarada){
                                        cantTotalDecDesc += element.ListaPescaDescargada[0].CantPescaDeclarada;
                                    }
                                }
                            } else if(element.TipoEvento == "1"){
                                visible.VisibleDescarga = true;
                                if(cantTotalDec > 0 && cantTotalDecDesc == 0){
                                    //falta mensaje
                                    mensaje = this.oBundle.getText("EXIPESDECNOEXIPESDES");
                                    MessageBox.error(mensaje);
                                }

                            }
                        }
                    }
                }

                if(bOk && tipoEvento == "6"){
                    visible.VisibleDescarga = false;
                    visible.FechFin = false;
                    bOk = this.validarPescaDescargada();
                    if(eventoActual.ListaPescaDescargada[0].CantPescaModificada){
                        eventoActual.CantTotalPescDescM = eventoActual.ListaPescaDescargada[0].CantPescaModificada;
                    }else{
                        eventoActual.CantTotalPescDescM = null;
                    }
                    this.obtenerTipoDescarga(eveActual);
                }

                if(bOk && tipoEvento == "8"){
                    visible.VisibleDescarga = true;
                    bOk = this._controler.Dat_Siniestro.validarSiniestros();
                }
            }
            return bOk;
        },

        cargarIncidental: function(){
            var bOk = true;
            var ndInciden = []; // lista de incidental viene del modelo de alejandro
            var ndIncidenTemp = []; // lista de incidental temp viene del modelo de alejandro
            var Utils = {};// objeto utils
            if(ndIncidenTemp.length > 0){
                var tmp = [];
                for (let index = 0; index < ndIncidenTemp.length; index++) {
                    const element = ndIncidenTemp[index];
                    if(element.Nrenv != Utils.NroEvento_Incidental){
                        tmp.push(element);
                    }
                }
                ndIncidenTemp = tmp;
            }
            if(ndInciden.legnth > 0){
                for (let index = 0; index < ndInciden.length; index++) {
                    const element = ndInciden[index];
                    var newObject = {
                        Cdspc: element.Cdspc,
                        Dsspc: element.Dsspc,
                        Nrenv: element.Nrenv,
                        Nrmar: element.Nrmar,
                        Pcspc: element.Pcspc
                    };
                    ndIncidenTemp.push(newObject);  
                }
            }
            return bOk;
        },
        obtenerTipoDescarga:function(evento){
            let eventoElement = this._controler._listaEventos[evento];
            let indPropiedad = this._controler._motivoMarea;
            let indPropPlanta = eventoElement.IndPropPlanta;
            let tipoDescarga = eventoElement.TipoDescarga;

            eventoElement.ListaPescaDescargada[0].TipoDesc = null;
            
            if (indPropiedad == "T") {
                eventoElement.ListaPescaDescargada[0].TipoDesc = "C";
            } else if (indPropiedad == "P") {
                if (indPropPlanta == "T" && tipoDescarga == "V") {
                    eventoElement.ListaPescaDescargada[0].TipoDesc = "V";
                }
            }	

        },

        validarPescaDescargada: function(){
            var bOk = true;
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            var valorAtributo = null;
            var DetalleMarea = this._controler._FormMarea;//modelo detalle de marea
            var eventoActual = this._controler._listaEventos[this._controler._elementAct];//modelo evento actual
            var PescaDescargada = eventoActual.ListaPescaDescargada[0]; //actual pesca descargada
            var tipoDescarga = eventoActual.TipoDescarga;
            var indPropPlanta = this._controler._indicadorPropXPlanta;
            var motMarea = this._controler._motivoMarea;;
            var centEmba = DetalleMarea.CenEmbarcacion;
            var atributos = ["CantPescaDescargada", "CantPescaDeclarada"];
            var mensaje = "";
            if(indPropPlanta == "T"){
                if(PescaDescargada.Especie == "0000000000"){
                    mensaje = this.oBundle.getText("SELECCESPECIE");
                    MessageBox.error(mensaje);
                    bOk = false;
                }
                if(PescaDescargada.Indicador == "N"){
                    PescaDescargada.NroDescarga = tipoDescarga + centEmba;
                    //Refrescar modelo
                    this._oView.getModel("eventos").updateBindings(true);
                }
                PescaDescargada.FechContabilizacion = eventoActual.FechProduccion;
                PescaDescargada.Planta = eventoActual.Planta;
            }else if(indPropPlanta == "P"){
                if(motMarea == "1"){
                    atributos = ["CantPescaDeclarada"];
                }else{
                    atributos = ["CantPescaDeclarada", "PuntDescarga", "FechContabilizacion"];
                }
                eventoActual.FechProduccion = PescaDescargada.FechContabilizacion;
                eventoActual.CantTotalPescDecla = PescaDescargada.CantPescaDeclarada;
                //refrescar modelo
                this._oView.getModel("eventos").updateBindings(true);
                if (PescaDescargada.NroDescarga) {
                    mensaje = this.oBundle.getText("SELECCDESCARGA");
                    MessageBox.error(mensaje);
                    bOk = false;
                }
            }

            if(atributos){
                var actualPescaDescargada = PescaDescargada//actual pesca descargada
                for (let index = 0; index < atributos.length; index++) {
                    const element = atributos[index];
                    var valor = actualPescaDescargada[element];
                    if(!valor){
                        bOk = false;
                        mensaje = this.oBundle.getText("MISSINGFIELD", [element]);
                        MessageBox.error(mensaje);
                    }
                    
                }
            }

            if(bOk){
                if(indPropPlanta == "T"){
                    PescaDescargada.CantPescaModificada = PescaDescargada.CantPescaDescargada;
                    //refrescar modelo
                    this._oView.getModel("eventos").updateBindings(true);
                }
                if(PescaDescargada.CantPescaModificada < 0){
                    bOk = false;
                    mensaje = this.oBundle.getText("CANTDESCARGANOCERO");
                    MessageBox.error(mensaje);
                }

                if(bOk){
                    if(PescaDescargada.CantPescaDeclarada < 0){
                        bOk = false;
                        mensaje = this.oBundle.getText("CANTDECLDESCNOCERO");// no se encontro en el pool de mensajes CANTDECLDESCNOCERO
                        MessageBox.error(mensaje);
                    }

                    if(bOk){
                        bOk = this._controler.validarCantPescaDeclDesc(); //llamar a metodo validarCantPescaDeclDesc
                        if(bOk && motMarea == "2" && indPropPlanta == "P"){
                            if(PescaDescargada.CantPescaModificada != PescaDescargada.BckCantPescaModificada){
                                if(PescaDescargada.CantPescaModificada > PescaDescargada.BckCantPescaModificada){
                                    PescaDescargada.IndEjecucion = "R";
                                }else{
                                    bOk = false;
                                    mensaje = this.oBundle.getText("ERRORCANTREINT");
                                    MessageBox.error(mensaje);
                                }
                            }
                        }
                    }
                }
            }else{
                bOk = false;
            }
            return bOk;
        },

        buscarDescarga: function (oEvent) {
            
            this.getDialogConsultaDescarga().open();
        },
        getDialogConsultaDescarga: function () {

            if (!this.oDialog_consultaDesc) {

                this.oDialog_consultaDesc = sap.ui.xmlfragment("com.tasa.registroeventospescav2.fragments.Popup_buscarDescarga", this);

                this._oView.addDependent(this.oDialog_consultaDesc);

            }

            return this.oDialog_consultaDesc;

        },

        cerrarPopUpDescarga: function (oEvent) {
            this._oView.getModel("popup_descarga").setProperty("/ListaDescargas", []);
            this.getDialogConsultaDescarga().close();
        },

        consultarDescarga: async function (oEvent) {
            let options = [];
            let comandos = [];
            let option = [];
            let nro_descarga = sap.ui.getCore().byId("pbd_nro_descarga").getValue();
            let cod_embarcacion = sap.ui.getCore().byId("pbd_cod_embarcacion").getValue();
            let matricula = sap.ui.getCore().byId("pbd_matricula").getValue();
            let nom_embarcacion = sap.ui.getCore().byId("pbd_nom_embarcacion").getValue();
            let cod_planta = sap.ui.getCore().byId("pbd_cod_planta").getValue();
            let nom_planta = sap.ui.getCore().byId("pbd_nom_planta").getValue();
            let fecha_inicio = sap.ui.getCore().byId("pbd_fecha_inicio").getValue();
            let tipo_Pesca = sap.ui.getCore().byId("pbd_tipo_pesca").getSelectedKey();
            let estado = sap.ui.getCore().byId("pbd_estado").getSelectedKey();

            console.log("dato recuperado : " + nro_descarga + " - " + cod_embarcacion + " - " + matricula + " - " + nom_embarcacion + " - "
            + cod_planta + " - " + nom_planta + " - " + fecha_inicio + " - " + tipo_Pesca + " - " + estado);

            if(tipo_Pesca){
                options.push({
                    cantidad: "1",
                    control:"COMBOBOX",
                    key:"CDTPC",
                    valueHigh: "",
                    valueLow:tipo_Pesca
                });
          
            }
            if(estado){
                options.push({
                    cantidad: "1",
                    control:"COMBOBOX",
                    key:"ESDES",
                    valueHigh: "",
                    valueLow:estado
                });
          
            }
            if(nro_descarga){
                options.push({
                    cantidad: "10",
                    control:"INPUT",
                    key:"NRDES",
                    valueHigh: "",
                    valueLow:nro_descarga
                });
          
            }
            if(cod_embarcacion){
                options.push({
                    cantidad: "10",
                    control:"INPUT",
                    key:"CDEMB",
                    valueHigh: "",
                    valueLow:cod_embarcacion
                });
          
            }
            if(matricula){
                options.push({
                    cantidad: "12",
                    control:"INPUT",
                    key:"MREMB",
                    valueHigh: "",
                    valueLow:matricula
                });
          
            }
            if(nom_embarcacion){
                options.push({
                    cantidad: "60",
                    control:"INPUT",
                    key:"NMEMB",
                    valueHigh: "",
                    valueLow:nom_embarcacion
                });
          
            }
            if(cod_planta){
                options.push({
                    cantidad: "4",
                    control:"INPUT",
                    key:"CDPTA",
                    valueHigh: "",
                    valueLow:cod_planta
                });
          
            }
            if(nom_planta){
                options.push({
                    cantidad: "60",
                    control:"INPUT",
                    key:"DSPTA",
                    valueHigh: "",
                    valueLow:nom_planta
                });
          
            }
            if(fecha_inicio){
                options.push({
                    cantidad: "8",
                    control:"INPUT",
                    key:"FIDES",
                    valueHigh: "",
                    valueLow:fecha_inicio
                });
          
            }
            console.log(this._controler._nroEvento);
            let s = await  this.cargar_servicios_pescaDesc(options);
            this._oView.getModel("popup_descarga").setProperty("/ListaDescargas", JSON.parse(this._DataPopup[0]).data);
            this._oView.getModel("popup_descarga").updateBindings(true);


        },
        consultarDescargaCHD: async function (oEvent) {
            let options = [];
            let comandos = [];
            let matricula = sap.ui.getCore().byId("pbdCHD_matricula").getValue();
            let nom_embarcacion = sap.ui.getCore().byId("pbdCHD_nom_embarcacion").getValue();
            let cod_planta = sap.ui.getCore().byId("pbdCHD_cod_planta").getValue();
            let nom_planta = sap.ui.getCore().byId("pbdCHD_nom_planta").getValue();
            let fecha_inicio = sap.ui.getCore().byId("pbdCHD_fecha_inicio").getValue();

            console.log("dato recuperado : " + matricula + " - " + nom_embarcacion + " - "
            + cod_planta + " - " + nom_planta + " - " + fecha_inicio);

            if(matricula){
                options.push({
                    cantidad: "12",
                    control:"INPUT",
                    key:"MREMB",
                    valueHigh: "",
                    valueLow:matricula
                });
          
            }
            if(nom_embarcacion){
                options.push({
                    cantidad: "60",
                    control:"INPUT",
                    key:"NMEMB",
                    valueHigh: "",
                    valueLow:nom_embarcacion
                });
          
            }
            if(cod_planta){
                options.push({
                    cantidad: "4",
                    control:"INPUT",
                    key:"CDPTA",
                    valueHigh: "",
                    valueLow:cod_planta
                });
          
            }
            if(nom_planta){
                options.push({
                    cantidad: "60",
                    control:"INPUT",
                    key:"DSPTA",
                    valueHigh: "",
                    valueLow:nom_planta
                });
          
            }
            if(fecha_inicio){
                options.push({
                    cantidad: "8",
                    control:"INPUT",
                    key:"FIDES",
                    valueHigh: "",
                    valueLow:fecha_inicio
                });
          
            }
            console.log(this._controler._nroEvento);
            let s = await  this.cargar_servicios_pescaDescCHD(options);
            this._oView.getModel("popup_descarga").setProperty("/ListaDescargas", JSON.parse(this._DataPopup[0]).data);
            this._oView.getModel("popup_descarga").updateBindings(true);


        },

        cargar_servicios_pescaDesc :function (options){
            let self = this;
            var s1 = TasaBackendService.obtenerListaDescargaPopUp(options);
            return Promise.all([s1]).then(values => {
                self._DataPopup = values;
                console.log(self._DataPopup);
                return true;
            }).catch(reason => {
                return false;
            })

        },

        cargar_servicios_pescaDescCHD :function (options){
            let self = this;
            var s1 = TasaBackendService.obtenerListaDescargaCHDPopUp(options);
            return Promise.all([s1]).then(values => {
                self._DataPopup = values;
                console.log(self._DataPopup);
                return true;
            }).catch(reason => {
                return false;
            })

        },
        obtenerItem :function (event){
            let mod = event.getSource().getBindingContext("popup_descarga");
            let data  =mod.getObject();
            let ListaPescDesc = this._oView.getModel("eventos").getData().ListaPescaDescargada[0];
            ListaPescDesc.Nro_descarga = data.NRDES;
            ListaPescDesc.TICKE = data.TICKE;
            ListaPescDesc.CDSPC = data.CDSPC;
            ListaPescDesc.DSSPC = data.DSSPC;
            ListaPescDesc.CNPDS = data.CNPDS;
            this._oView.getModel("eventos").updateBindings(true);
            this.getDialogConsultaDescarga().close();
            //console.log("Holaaaaaaaaaaaaaa");
        },
        eliminarDesacarga: function(event){
            let mod = event.getSource().getBindingContext("eventos");
            let data  =mod.getObject();
            let desc = data.Nro_descarga;
            let self = this;

            let ListaPescaDescElim = this._oView.getModel("eventos").getData().ListaPescaDescargada;
            let atrb_nuevoDes = ListaPescaDescElim[0].EsNuevo ? true : false;

            if(atrb_nuevoDes && ListaPescaDescElim[0].EsNuevo == true){ // se setea nuevo a la hora de creacion
                for (var i = 0; i < ListaPescaDescElim.length; i++) {
                    if(ListaPescaDescElim[i].Nro_descarga == desc){
                        ListaPescaDescElim.splice(i, 1);
                    }
                        
                }
                ListaPescaDescElim[0].EsNuevo = true;
                ListaPescaDescElim[0].Indicador = "N";
                ListaPescaDescElim[0].CNPCM = textValidaciones.CantPescaDeclaRestante;
                if (this._controler._motivoMarea == "1") {
					ListaPescaDescElim[0].CDTPC = "D";
				} else if (this._controler._motivoMarea =="2") {
					ListaPescaDescElim[0].CDTPC = "I";
				}

                if (this._controler._indicadorPropXPlanta == "T") { //Descarga en planta tercera
					ListaPescaDescElim[0].CDSPC = "0000000000";
					ListaPescaDescElim[0].Nro_descarga = this._controler._nroDescarga + "T";
                    ListaPescaDescElim[0].FECCONMOV  = this._oView.byId("dtf_FechaProduccion").getValue(); //Obtengo el valor de fecha de contabilizacion
					ListaPescaDescElim[0].CDPTA = this._controler._codPlanta; //Obtengo la planta del evento
				} else if (this._controler._indicadorPropXPlanta == "P") { //Descarga en planta propia
                    this._oView.byId("pdt_col_BuscarDesc").setVisible(true);
                    this._oView.byId("pdt_col_EliminarDesc").setVisible(false);

                        ListaPescaDescElim[0].Indicador = "E";
						ListaPescaDescElim[0].IndEjecucion = "C";
				}

                this._oView.getModel("eventos").setProperty("/ListaPescaDescargada",ListaPescaDescElim);

            }else{
                let sResponsivePaddingClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer";
                if (this._controler._indicadorPropXPlanta == "T") {
					MessageBox.show(
                        '�Realmente desea eliminar el registro de pesca descargada?',
                        {
                            icon: MessageBox.Icon.WARNING,
                            title: "Eliminar pesca descargada",
                            actions: [MessageBox.Action.OK, MessageBox.Action.NO],
                            emphasizedAction: MessageBox.Action.OK,
                            styleClass: "sapUiSizeCompact",
                            onClose: function (sAction) {
                                if(sAction == "OK"){
                                    self.eliminarPescaDescargada();
                                }
                            }
                        }
                    );
				} else if (this._controler._indicadorPropXPlanta =="P") { //Descarga en planta propia
					if (this._controler._motivoMarea == "1") {
						MessageBox.show(
                            '�Realmente desea eliminar el registro de pesca descargada?',
                            {
                                icon: MessageBox.Icon.WARNING,
                                title: "Eliminar pesca descargada",
                                actions: [MessageBox.Action.OK, MessageBox.Action.NO],
                                emphasizedAction: MessageBox.Action.OK,
                                styleClass: sResponsivePaddingClasses,
                                onClose: function (sAction) {
                                    if(sAction == "OK"){
                                        self.eliminarPescaDescargada();
                                    }
                                }
                            }
                        );
					} else if (this._controler._motivoMarea == "2") {
						MessageBox.show(
                            '�Realmente desea eliminar el registro de pesca descargada?,\n este proceso es irreversible y puede durar varios minutos.',
                            {
                                icon: MessageBox.Icon.WARNING,
                                title: "Eliminar pesca descargada",
                                actions: [MessageBox.Action.OK, MessageBox.Action.NO],
                                emphasizedAction: MessageBox.Action.OK,
                                styleClass: sResponsivePaddingClasses,
                                onClose: function (sAction) {
                                    if(sAction == "OK"){
                                        self.eliminarPescaDescargada();
                                    }
                                }
                            }
                        );
					}
				}
                
                
            }

            
        },
        eliminarPescaDescargada : async function(){
            let bOk = true;
            let ListaPescaDescElim = [];

            if (this._controler._indicadorPropXPlanta =="P" && this._controler._motivoMarea == "2") {
                bOk = await this.anularEventoDescarga(this._controler._nroDescarga, false);
            }
            if (bOk) {
                if (this._controler._indicadorPropXPlanta =="T" || this._controler._indicadorProp == "T") {
                    // precioMareaElim.setEspecie(pescaDescargadaElement.getEspecie());  --- Revisar mas a fondo si es necesario.
                    // wdContext.nodePreciosMareaEliminados().addElement(
                    //     precioMareaElim);
                }
                ListaPescaDescElim[0].Indicador = "N";
                ListaPescaDescElim[0].EsNuevo = true;
                ListaPescaDescElim[0].CNPCM = textValidaciones.CantPescaDeclaRestante;
                if (this._controler._motivoMarea == "1") {
					ListaPescaDescElim[0].CDTPC = "D";
				} else if (this._controler._motivoMarea =="2") {
					ListaPescaDescElim[0].CDTPC = "I";
				}

                if (this._controler._indicadorPropXPlanta == "T") { //Descarga en planta tercera
					ListaPescaDescElim[0].CDSPC = "0000000000";
					ListaPescaDescElim[0].Nro_descarga = this._controler._nroDescarga + "T";
                    ListaPescaDescElim[0].FECCONMOV  = this._oView.byId("dtf_FechaProduccion").getValue(); //Obtengo el valor de fecha de contabilizacion
					ListaPescaDescElim[0].CDPTA = this._controler._codPlanta; //Obtengo la planta del evento
				} else if (this._controler._indicadorPropXPlanta == "P") { //Descarga en planta propia
                    this._oView.byId("pdt_col_BuscarDesc").setVisible(true);
                    this._oView.byId("pdt_col_EliminarDesc").setVisible(false);

                        ListaPescaDescElim[0].Indicador = "E";
						ListaPescaDescElim[0].IndEjecucion = "C";
				}

                this._oView.getModel("eventos").setProperty("/ListaPescaDescargada",ListaPescaDescElim);
            }

            //MessageToast.show("hOLA METODO");

        },
        anularEventoDescarga : async function(nroDescarga, anularEvento){
            let bOk = await this.anularDescargaRFC(nroDescarga);
            
            if (!bOk) {
                MessageBox.error("Lo sentimos hubo un error al eliminar la descarga");
            } else {
                if (anularEvento) {
                    //ELIMINAR DE TABLA EVENTO
                    let elimDesc =  await TasaBackendService.eliminarPescaDescargada(this._controler._nroMarea, this._controler._nroEvento);
                    let consulta  = await Promise.all([elimDesc]).then(values => {
                        return true; }).catch(reason => { return false; })

                } else {
                    //METODO ACTUALIZAR TABLA
                    let ActualizDesc =  await TasaBackendService.actualizarPescaDescargada(this._controler._nroMarea, this._controler._nroEvento);
                    let consulta     =  await Promise.all([ActualizDesc]).then(values => {
                        return true; }).catch(reason => { return false; })
                    
                }
            }
            return bOk;
        },
        anularDescargaRFC : async function(nroDescarga){
            let anularDesc =  await TasaBackendService.anularDescargaRFC(nroDescarga);
            let consulta  = await Promise.all([anularDesc]).then(values => {
                        if(values.mensaje == "E"){
                            return false;
                        }else{
                            return true;
                        }
                         
                    }).catch(reason => { return false; })
            return consulta;

        }



    });
});