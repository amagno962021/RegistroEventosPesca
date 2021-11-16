sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"./General",
    "./Distribucion",
    "./PescaDeclarada",
    "./PescaDescargada",
    "./Horometro",
    "./Equipamiento",
    "./Siniestro",
    "./Accidente",
    "./Biometria",
    "../model/textValidaciones",
    "../model/eventosModel",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/integration/library",
    "sap/ui/core/Fragment",
    "../Service/TasaBackendService",
    "sap/m/MessageBox"
], function (
	Controller,
	General,
    Distribucion,
    PescaDeclarada,
    PescaDescarga,
    Horometro,
    Equipamiento,
    Siniestro,
    Accidente,
    Biometria,
    textValidaciones,
    eventosModel,
    JSONModel,
    MessageToast,
    integrationLibrary,
    Fragment,
    TasaBackendService,
    MessageBox
) {
	"use strict";

	return Controller.extend("com.tasa.registroeventospescav2.controller.DetalleEvento", {

		/**
		 * @override
		 */
		

		 onInit: function () {
            this.router = this.getOwnerComponent().getRouter();
            this.router.getRoute("DetalleEvento").attachPatternMatched(this._onPatternMatched, this);

        },

        onBackDetalleMarea: function(){
            history.go(-1);
        },

        _onPatternMatched: function (oEvent) {
            //modelo de alejandro
            var modeloDetalleMarea = this.getOwnerComponent().getModel("DetalleMarea");
            var dataDetalleMarea = modeloDetalleMarea.getData();
            let ListaEventos_cont = dataDetalleMarea.Eventos.Lista; 
            let MareaAnterior_cont = dataDetalleMarea.MareaAnterior; 
            let EsperaMareaAnt_cont = dataDetalleMarea.EsperaMareaAnt;  
            let FormEvent_cont = dataDetalleMarea;

            console.log("FormEvent_cont: ", FormEvent_cont);

            /********* Carga de variables globales **********/
            this._elementAct = "0";//ESTE ES ITEM DE LA LISTA DE EVENTOS SELECCIONADO
            this._utilNroEventoBio = "001";
            this._utilNroEventoIncid = "001";
            this._motivoMarea = dataDetalleMarea.Cabecera.CDMMA;
            this._tipoEvento = ListaEventos_cont[this._elementAct].CDTEV;
            this._nroEvento = "3";//ESTE ES EL NUMERO DEL EVENTO SELECCIONADO DE LA LISTA DE DETALLE
            this._nroMarea = FormEvent_cont.Cabecera.NRMAR + "";//"165728";
            this._nroDescarga = ListaEventos_cont[this._elementAct].NRDES;//"TCHI001444";
            this._indicador = ListaEventos_cont[this._elementAct].INPRP;//"E";
            this._indicadorProp = ListaEventos_cont[this._elementAct].INPRP;
            this._codPlanta = FormEvent_cont.Cabecera.CDPTA;
            this._embarcacion = FormEvent_cont.Cabecera.CDEMB;//"0000000012";
            this._indicadorPropXPlanta = FormEvent_cont.Cabecera.INPRP;
            this._soloLectura = true;//data de session solo lectura obtenida desde el principal
            this._EsperaMareaAnt = EsperaMareaAnt_cont;//[{ "id": "0" }, { "id": "1" }]; 
            this._listaEventos = ListaEventos_cont;
            this._FormMarea = FormEvent_cont.Cabecera;
            //this._listaEventos = [{ "Numero": "1", "id": "0", "TipoEvento": "7", "MotiNoPesca": "no pesca", "EstaOperacion": "L", "ObseAdicional": "Prueba", "ZPLatiIni": "", "ZPLatiFin": "", "ZPLongIni": "", "ZPLongFin": "", "CantTotalPescDecla": "","CantTotalPescDeclaM":"", "ListaBodegas": [],"ListaBiometria": [], "ListaPescaDeclarada" : [], "ListaPescaDescargada" : [],"ListaHorometros" : [], "ListaEquipamiento" :[], "ListaAccidente" :[], "ListaSiniestros": [],"ListaIncidental":[],"eListaPescaDeclarada":[] }, { "Numero": "2", "id": "1", "TipoEvento": "2", "MotiNoPesca": "7", "EstaOperacion": "L", "ObseAdicional": "Prueba", "ZPLatiIni": "", "ZPLatiFin": "", "ZPLongIni": "", "ZPLongFin": "", "CantTotalPescDecla": "","CantTotalPescDeclaM":"", "ListaBodegas": [],"ListaBiometria": [], "ListaPescaDeclarada" : [], "ListaPescaDescargada" : [],"ListaHorometros" : [], "ListaEquipamiento" :[], "ListaAccidente" :[],"ListaSiniestros": [],"ListaIncidental":[],"eListaPescaDeclarada":[]  }];
            //this._FormMarea = {"EsNuevo":true, "EstMarea": "C", "EstCierre": "A", "FecCierre": "02/24/2021", "HorCierre": "17:04:50", "ObseAdicional": "Prueba", "CenEmbarcacion": "T059" };
            this._mareaReabierta = false;
            this._zonaPesca = ListaEventos_cont[this._elementAct].CDZPC;
            this._IsRolRadOpe = true; //ESTO ES VALORES DE SON DE ROLES QUE VIENE DE MAREA
            this._IsRolIngComb = true;//ESTO ES VALORES DE SON DE ROLES QUE VIENE DE MAREA
            this._tipoPreservacion = ""; //viene de la consulta al servicio
            this._opSistFrio = false; //VALOR DE UTILITARIO DE LA VISTA GLOBAL
            this._listasServicioCargaIni;
            this._listaEventosBkup;
            this._listaMareaAnterior = MareaAnterior_cont;
            this._eventoNuevo="5"; //VALOR DEL ID DEL EVENTO NUEVO DE LA LISTA PRINCIPAL
            this.cargarListasEventoSelVacias();
            /************ Listas iniciales vacias **************/
            this._ConfiguracionEvento = {};
            this._cmbPuntosDescarga = [];
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            /************ Carga de fragments de los eventos **************/
            let self = this;
            this.cargarServiciosPreEvento().then(r => {
                if (r) {
                    self.getFragment();
                } else {
                    alert("Error");
                }
            })

            // var cardManifests = new JSONModel();
            var EventosModelo = new JSONModel();
            var oProductsModel = new JSONModel();
                
            this.getView().setModel(oProductsModel, "products");
            this.getView().setModel(EventosModelo, "eventos");

            EventosModelo.setData(this._listaEventos[this._elementAct]);
            oProductsModel.setData(eventosModel);
            oProductsModel.setProperty("/enabledEspecie", true);
            EventosModelo.setProperty("/enabledBodCantpesca", true);
            EventosModelo.setProperty("/enabledCantPescDeclarada", true);

            EventosModelo.setProperty("/enabledCantPescDescargada", true);
            EventosModelo.setProperty("/enabledCantPescDeclDesc", true);
            EventosModelo.setProperty("/enabledPuntoDescarga", true);
            EventosModelo.setProperty("/enabledFechProdDesc", true);
            EventosModelo.setProperty("/enabledAveriado", true);
            EventosModelo.setProperty("/enabledCantEquipamiento", true);
        },
        cargarListasEventoSelVacias:function(){
            this._listaEventos[this._elementAct].ListaBodegas = [];
            this._listaEventos[this._elementAct].ListaBiometria = [];
            this._listaEventos[this._elementAct].ListaPescaDeclarada = [];
            this._listaEventos[this._elementAct].ListaPescaDescargada = [];
            this._listaEventos[this._elementAct].ListaHorometros = [];
            this._listaEventos[this._elementAct].ListaEquipamiento = [];
            this._listaEventos[this._elementAct].ListaAccidente = [];
            this._listaEventos[this._elementAct].ListaSiniestros = [];
            this._listaEventos[this._elementAct].ListaIncidental = [];
            this._listaEventos[this._elementAct].eListaPescaDeclarada = [];
        },

        obtenerTab :function(event){
            let tab_evento_sel = event.getParameter("selectedItem").getProperty("text");
            console.log(event.getParameter("selectedItem").getProperty("text"));
            this.Dat_General.onActionSelectTab(tab_evento_sel);
        },
        cargaModelos: function () {

            this.getView().getModel("eventos").setProperty("/ListaBodegas", this._listaEventos[this._elementAct].ListaBodegas);
            let lst_PescaDescargada = this._listaEventos[this._elementAct].ListaPescaDescargada;
            let lst_Horometro = this._listaEventos[this._elementAct].ListaHorometros;
            if(lst_PescaDescargada.length > 0){lst_PescaDescargada[0].Nro_descarga = this._nroDescarga;}

            //combo Zona de Pesca
            var combZonaPesca = new JSONModel(this._listasServicioCargaIni[10].data[0]);
            this.getView().setModel(combZonaPesca, "combZonaPesca");
            this.getView().getModel("combZonaPesca").updateBindings(true);

            //combo Estado Operacion
            var combEstadoOperacion = new JSONModel(this._listasServicioCargaIni[11].data[0]);
            this.getView().setModel(combEstadoOperacion, "combEstadoOperacion");
            this.getView().getModel("combEstadoOperacion").updateBindings(true);

            //combo Motivo Limitacion
            var combMotivoLim = new JSONModel(this._listasServicioCargaIni[12].data[0]);
            this.getView().setModel(combMotivoLim, "combMotivoLim");
            this.getView().getModel("combMotivoLim").updateBindings(true);

            //combo Tipo de descarga
            var combTipoDescarga = new JSONModel(this._listasServicioCargaIni[13].data[0]);
            this.getView().setModel(combTipoDescarga, "combTipoDescarga");
            this.getView().getModel("combTipoDescarga").updateBindings(true);

            //combo Motivo no pesca
            var combMotivoNoPesca = new JSONModel(this._listasServicioCargaIni[14].data[0]);
            this.getView().setModel(combMotivoNoPesca, "combMotivoNoPesca");
            this.getView().getModel("combMotivoNoPesca").updateBindings(true);

            //combo Motivo de espera
            var combMotivoEspera = new JSONModel(this._listasServicioCargaIni[15].data[0]);
            this.getView().setModel(combMotivoEspera, "combMotivoEspera");
            this.getView().getModel("combMotivoEspera").updateBindings(true);

            //combo Sistema Frio
            var combSistemaFrio = new JSONModel(this._listasServicioCargaIni[16].data[0]);
            this.getView().setModel(combSistemaFrio, "combSistemaFrio");
            this.getView().getModel("combSistemaFrio").updateBindings(true);

            //combo Punto de descarga
            var combPuntoDescarga = new JSONModel(JSON.parse(this._listasServicioCargaIni[6]));
            this.getView().setModel(combPuntoDescarga, "combPuntoDescarga");
            this.getView().getModel("combPuntoDescarga").updateBindings(true);

            //AYUDA DE BUSQUEDA ESPECIES
            var popupEspecies = new JSONModel(this._listasServicioCargaIni[17].data[0]);
            this.getView().setModel(popupEspecies, "popupEspecies");
            this.getView().getModel("popupEspecies").updateBindings(true);

            this.getView().getModel("eventos").setProperty("/ListaPescaDescargada", lst_PescaDescargada);
            this.getView().getModel("eventos").setProperty("/ListaPescaDeclarada", this._listaEventos[this._elementAct].ListaPescaDeclarada);
            this.getView().getModel("eventos").setProperty("/ListaHorometros", this._listaEventos[this._elementAct].ListaHorometros);
            this.getView().getModel("eventos").setProperty("/ListaEquipamiento", this._listaEventos[this._elementAct].ListaEquipamiento);
            this.getView().getModel("eventos").updateBindings(true);
        },

        cargarServiciosPreEvento: function () {

            let self = this;
            var s1 = TasaBackendService.obtenerCodigoTipoPreservacion(this._embarcacion, this.getCurrentUser());
            var s2 = TasaBackendService.obtenerListaEquipamiento(this._embarcacion, this.getCurrentUser());
            var s3 = TasaBackendService.obtenerListaCoordZonaPesca(this._zonaPesca, this.getCurrentUser());
            var s4 = TasaBackendService.obtenerListaPescaDeclarada(this._nroMarea, this._nroEvento, this.getCurrentUser());
            var s5 = TasaBackendService.obtenerListaBodegas(this._embarcacion, this.getCurrentUser());
            var s6 = TasaBackendService.obtenerListaPescaBodegas(this._nroMarea, this._nroEvento, this.getCurrentUser());
            var s7 = TasaBackendService.obtenerListaPuntosDescarga(this._codPlanta, this.getCurrentUser());
            var s8 = TasaBackendService.obtenerListaPescaDescargada(this._nroDescarga, this.getCurrentUser());
            //var s9 = TasaBackendService.obtenerListaSiniestros(this._nroMarea, this._nroEvento); ---> PENDIENTE EN REVISAR
            var s10 = TasaBackendService.obtenerListaHorometro(this._FormMarea.WERKS, this._tipoEvento, this._nroMarea, this._nroEvento);
            var s11 = TasaBackendService.obtenerConfiguracionEvento();
            var s12 = TasaBackendService.obtenerDominio("1ZONAPESCA");
            var s13 = TasaBackendService.obtenerDominio("ZESOPE");
            var s14 = TasaBackendService.obtenerDominio("ZCDMLM");
            var s15 = TasaBackendService.obtenerDominio("ZCDTDS");
            var s16 = TasaBackendService.obtenerDominio("ZCDMNP");
            var s17 = TasaBackendService.obtenerDominio("ZCDMES");
            var s18 = TasaBackendService.obtenerDominio("ZD_SISFRIO");
            var s19 = TasaBackendService.obtenerDominio("ESPECIE");
            var s20 = TasaBackendService.obtenerMareaBiometria(this._embarcacion,this._nroMarea, this.getCurrentUser());

            return Promise.all([s1, s2, s3, s4, s5, s6, s7, s8, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20]).then(values => {
                self._tipoPreservacion = JSON.parse(values[0]).data[0].CDTPR;
                self._listasServicioCargaIni = values;
                console.log(self._listasServicioCargaIni);
                return true;
            }).catch(reason => {
                return false;
            })

        },

        getFragment: async function () {
            var o_tabGeneral = this.getView().byId("idGeneral");
            var o_tabDistribucion = this.getView().byId("idDistribucion");
            var o_tabPescaDeclarada = this.getView().byId("idPescaDecl");
            var o_tabPescaDescargada = this.getView().byId("idPescaDesc");
            var o_tabHorometro = this.getView().byId("idHorometro");
            var o_tabEquipamiento = this.getView().byId("idEquipamiento");
            var o_tabSiniestro = this.getView().byId("idSiniestro");
            var o_tabAccidente = this.getView().byId("idAccidente");
            var o_tabBiometria = this.getView().byId("idBiometria");

            var o_fragment = new General(this.getView(), "General",this);
            var o_fragment2 = new General(this.getView(), "General_fechas",this);
            var o_fragment3 = new General(this.getView(), "General_operacion",this);
            var o_fragment4 = new General(this.getView(), "General_espera",this);
            var o_fragment5 = new General(this.getView(), "General_adicional",this);

            var o_fragment6 = new Distribucion(this.getView(), "Distribucion");
            var o_fragment7 = new PescaDeclarada(this.getView(), "PescaDeclarada",this);
            var o_fragment8 = new PescaDescarga(this.getView(), "PescaDescargada",this);
            var o_fragment9 = new Horometro(this.getView(), "Horometro",this);
            var o_fragment10 = new Equipamiento(this.getView(), "Equipamiento");
            var o_fragment11 = new Siniestro(this.getView(), "Siniestro",this);
            var o_fragment12 = new Accidente(this.getView(), "Accidente");
            var o_fragment13 = new Biometria(this.getView(), "Biometria", this._utilNroEventoBio, this);


            o_tabGeneral.addContent(o_fragment.getcontrol());
            o_tabGeneral.addContent(o_fragment2.getcontrol());
            o_tabGeneral.addContent(o_fragment3.getcontrol());
            o_tabGeneral.addContent(o_fragment4.getcontrol());
            o_tabGeneral.addContent(o_fragment5.getcontrol());

            o_tabDistribucion.addContent(o_fragment6.getcontrol());
            o_tabPescaDeclarada.addContent(o_fragment7.getcontrol());
            o_tabPescaDescargada.addContent(o_fragment8.getcontrol());
            o_tabHorometro.addContent(o_fragment9.getcontrol());
            o_tabEquipamiento.addContent(o_fragment10.getcontrol());
            o_tabSiniestro.addContent(o_fragment11.getcontrol());
            o_tabAccidente.addContent(o_fragment12.getcontrol());
            o_tabBiometria.addContent(o_fragment13.getcontrol());

            //SETEAR VALOR GLOBAL FRAGMENTS
            this.Dat_Horometro = o_fragment9;
            this.Dat_General =o_fragment;
            this.Dat_PescaDeclarada = o_fragment7;
            this.Dat_Siniestro = o_fragment11;
            this.Dat_PescaDescargada = o_fragment8;

            if (this._listasServicioCargaIni[9] ? true : false) {
                this._ConfiguracionEvento = this._listasServicioCargaIni[9];
            }
            var ss = this._listasServicioCargaIni[11].data[0].data;
            await this.prepararRevisionEvento(false);
            this.cargaModelos();

        },

        _onButtonPress1: function () {

        },

        _onButtonPress: function (o_event) {
            console.log(o_event);
        },

        prepararRevisionEvento: function (soloDatos) {
            if (this._tipoEvento == textValidaciones.TIPOEVENTOCALA) {
                var fechaIniEnvase = this.getView().byId("FechaEnvaseIni");
                fechaIniEnvase.setVisible(true);
                var fechaIniEnvaseText = this.getView().byId("0001");
                fechaIniEnvaseText.setHeaderText("Envase");
            } else {
                var fechaIniEnvaseText = this.getView().byId("0001");
                fechaIniEnvaseText.setHeaderText("Fechas");
            }

            if (this._tipoEvento == textValidaciones.TIPOEVENTODESCARGA
                && this.buscarValorFijo(textValidaciones.MOTIVOPESCADES, this._motivoMarea)) {
                var fechaIniEnvase = this.getView().byId("FechaEnvaseIni");
                fechaIniEnvase.setVisible(false);
                var fechaFinEnvase = this.getView().byId("FechaEnvaseFin");
                fechaFinEnvase.setVisible(false);
                this.obtenerPescaDeclDescarga();
            }

            this.obtenerDetalleEvento();

            if (!soloDatos) {
                this.prepararVista(false);
                this.mngBckEventos(true);
            }

        },

        buscarValorFijo: function (arrayRecorrido, valor_a_encontrar) {

            var encontroValor = false

            for (var i = 0; i < arrayRecorrido.length; i++) {

                if (arrayRecorrido[i].id == valor_a_encontrar) {
                    encontroValor = true;
                }
            }


            return encontroValor
        },
        obtenerDetalleEvento: function () {
            var datCons = false// wdThis.getEventoConsultado(nroEvento);

            if (this._indicador == "E" && !datCons) {
                //wdThis.setEventoConsultado(nroEvento, true);

                if (this.buscarValorFijo(textValidaciones.EVEVISTABHOROM, this._tipoEvento)) {
                    this.obtenerHorometros();
                }

                if (this.buscarValorFijo(textValidaciones.EVEVISTABEQUIP, this._tipoEvento)) {
                    this.obtenerEquipamiento();
                }

                if (this._tipoEvento == textValidaciones.TIPOEVENTOCALA) {
                    this.obtenerCoordZonaPesca();
                    this.obtenerPescaDeclarada();
                    if (this._motivoMarea == "1") {
                        this.obtenerBodegas();
                        this.obtenerPescaBodega();
                    }
                }

                if (this._tipoEvento == textValidaciones.TIPOEVENTODESCARGA) {
                    var fechaIniEnvase = this.getView().byId("FechaEnvaseIni");
                    fechaIniEnvase.setVisible(false);
                    var fechaFinEnvase = this.getView().byId("FechaEnvaseFin");
                    fechaFinEnvase.setVisible(false);

                    this.obtenerPuntosDescarga();
                    this.obtenerPescaDescargada();
                }

                if (this._tipoEvento == textValidaciones.TIPOEVENTOHOROMETRO) {
                    var fechaIniEnvase = this.getView().byId("FechaEnvaseIni");
                    fechaIniEnvase.setVisible(true);
                    //wdThis.obtenerSiniestros(marea, nroEvento);
                }

                // eventosElement.setFechModificacion(new Date(Calendar.getInstance().getTimeInMillis()));
                // eventosElement.setHoraModificacion(new Time(Calendar.getInstance().getTimeInMillis()));
                // eventosElement.setAutoMoficicacion(wdThis.wdGetMainCompController().wdGetContext().currentDataSessionElement().getUser());

            }
        },
        obtenerPescaDeclDescarga: function () {
            var fechaIniEnvase = this.getView().byId("FechaEnvaseIni");
            fechaIniEnvase.setVisible(false);
            var fechaFinEnvase = this.getView().byId("FechaEnvaseFin");
            fechaFinEnvase.setVisible(false);
            let nroEventoTope = this._listaEventos[this._elementAct].Numero;

            let cantTotalDecl = Number('0');
            let cantTotalDeclDesc = Number('0');
            let cantTotalDeclRest = Number('0');
            let primerRecorrido = Number(this._elementAct) + Number(1);

            for (var j = primerRecorrido; j < this._listaEventos.length; j++) {
                nroEventoTope = this._listaEventos[j].Numero;

                if (this._listaEventos[j].TipoEvento == "1") {
                    break;
                }

            }
            cantTotalDecl = this.obtenerCantTotalPescaDecla(nroEventoTope);
            cantTotalDeclDesc = this.obtenerCantTotalPescaDeclDesc(nroEventoTope);
            cantTotalDeclRest =  cantTotalDecl - cantTotalDeclDesc;

            if (this._listaEventos[this._elementAct].ListaPescaDescargada[0].CantPescaDeclarada ? true : false) {
                cantTotalDeclRest = cantTotalDeclRest + Number(this._listaEventos[this._elementAct].ListaPescaDescargada[0].CantPescaDeclarada);
            }

            textValidaciones.CantPescaDeclaRestante = cantTotalDeclRest;


        },

        prepararVista: function (nuevoEvento) {
            //this.resetView();
            var exisEspMarAnt = false;
            if (this._EsperaMareaAnt != null && this._EsperaMareaAnt.length > 0) { exisEspMarAnt = true; } else { exisEspMarAnt = false; }

            //Datos de fecha	
            if (this._tipoEvento == textValidaciones.TIPOEVENTOZARPE) {
                var fechaIniEnvase = this.getView().byId("FechaEnvaseIni");
                fechaIniEnvase.setVisible(true);

                if (this._listaEventos.length > 1 && this._elementAct > 0) {
                    var elementoAnt = Number(this._elementAct) - 1

                    if (this._listaEventos[elementoAnt].TipoEvento == textValidaciones.TIPOEVENTOESPERA) {
                        var dtf_fechaIniEnv = this.getView().byId("dtf_fechaIniEnv");
                        dtf_fechaIniEnv.setEnabled(false);
                    }

                } else if (exisEspMarAnt) {
                    var dtf_fechaIniEnv = this.getView().byId("dtf_fechaIniEnv");
                    dtf_fechaIniEnv.setEnabled(false);
                }
            }

            //Datos de ubicacion
            if (this.buscarValorFijo(textValidaciones.EVEVISUEMPRESA, this._tipoEvento)) {
                var fe_empresa = this.getView().byId("fe_Empresa");
                fe_empresa.setVisible(true);

                if (this._tipoEvento == textValidaciones.TIPOEVENTOARRIBOPUE) {
                    var fechaIniEnvase = this.getView().byId("FechaEnvaseIni");
                    fechaIniEnvase.setVisible(true);
                    var btn_Planta = this.getView().byId("btn_Planta");
                    btn_Planta.setVisible(true);
                }
            }

            if (this.buscarValorFijo(textValidaciones.EVEVISZONPESCA, this._tipoEvento)) {
                var fe_ZonaPesca = this.getView().byId("fe_ZonaPesca");
                fe_ZonaPesca.setVisible(true);

                if (this._tipoEvento == textValidaciones.TIPOEVENTOCALA) {
                    var fechaIniEnvase = this.getView().byId("FechaEnvaseIni");
                    fechaIniEnvase.setVisible(true);
                    var f_LatitudLongitud = this.getView().byId("f_LatitudLongitud");
                    f_LatitudLongitud.setVisible(true);

                    if (this._motivoMarea == "1") {
                        var fe_muestra = this.getView().byId("fe_muestra");
                        fe_muestra.setVisible(false);
                    }
                }

                if (this.buscarValorFijo(textValidaciones.READONLYZONPES, this._tipoEvento)) {
                    this.getView().byId("cb_ZonaPesca").setEnabled(false);
                }
            }
            //Datos de las fecha de cala de biometria 	 
            if (this.buscarValorFijo(textValidaciones.EVEVISFECHABIO, this._tipoEvento)) {
                var fe_fechaIniCala = this.getView().byId("fe_fechaIniCala");
                fe_fechaIniCala.setVisible(true);
                var fe_fechaFinCala = this.getView().byId("fe_fechaFinCala");
                fe_fechaFinCala.setVisible(true);
            }
            //Datos de fechas
            if (this.buscarValorFijo(textValidaciones.EVEVISFECHAFIN, this._tipoEvento)) {
                var labelTextFechIniEnv = this.getView().byId("labelTextFechIniEnv");
                labelTextFechIniEnv.setText("Fecha/hora inicio");
                var fechaFinEnvase = this.getView().byId("FechaEnvaseFin");
                fechaFinEnvase.setVisible(true);

                if (this._tipoEvento == textValidaciones.TIPOEVENTODESCARGA) {
                    this.getView().byId("FechaEnvaseIni").setVisible(false);
                    this.getView().byId("FechaEnvaseFin").setVisible(false);
                    this.getView().byId("fe_FechaProduccion").setVisible(true);
                    if (this._indicadorPropXPlanta == textValidaciones.INDIC_PROPIEDAD_PROPIOS) {
                        this.getView().byId("dtf_FechaProduccion").setEnabled(false);
                        //Sea (CHI o CHD)
                        if (this._motivoMarea == "2" || this._motivoMarea == "1") {
                            this.getView().byId("dtf_fechaIniEnv").setEnabled(false);
                            this.getView().byId("dtf_fechaFinEnv").setEnabled(false);
                        }
                    }
                }
                else if (this._tipoEvento == textValidaciones.TIPOEVENTOCALA) {
                    this.getView().byId("FechaEnvaseIni").setVisible(false);
                    this.getView().byId("labelTextFechIniEnv").setText("Fech/hora ini. envase");
                }
            } else {
                if (this._tipoEvento == textValidaciones.TIPOEVENTOSALIDAZONA) {
                    this.getView().byId("FechaEnvaseIni").setVisible(true);
                    this.getView().byId("fe_fechaArribo").setVisible(true);
                }
            }

            if (this._tipoEvento == textValidaciones.TIPOEVENTOARRIBOPUE
                && this._listaEventos[this._elementAct].MotiNoPesca != "") {
                this.getView().byId("FechaEnvaseIni").setVisible(true);
                this.getView().byId("fe_MotiNoPesca").setVisible(true);
            }

            if (this._tipoEvento == textValidaciones.TIPOEVENTOESPERA) {
                this.getView().byId("FechaEnvaseIni").setVisible(true);
                this.getView().byId("0004").setVisible(true);
                this.getView().byId("dtf_fechaIniEnv").setEnabled(false);
            }

            //Datos de operacion
            if (this.buscarValorFijo(textValidaciones.EVEVISESTAOPER, this._tipoEvento)) {
                this.getView().byId("0003").setVisible(true);
                this.getView().byId("fe_estadoOperacion").setVisible(true);

                if (this._indicadorPropXPlanta == textValidaciones.INDIC_PROPIEDAD_PROPIOS && (this._tipoEvento == textValidaciones.TIPOEVENTOLLEGADAZONA || this._tipoEvento == textValidaciones.TIPOEVENTOSALIDAZONA)) {

                    this.getView().byId("fe_estadoOperacion").setVisible(false);
                }

                if (this._tipoEvento == textValidaciones.TIPOEVENTODESCARGA) {
                    this.getView().byId("FechaEnvaseIni").setVisible(false);
                    this.getView().byId("FechaEnvaseFin").setVisible(false);

                    this.getView().byId("fe_estadoOperacion").setVisible(true);//cambiar a false
                    this.getView().byId("fe_tipoDescarga").setVisible(true);

                    if (this._indicadorProp == textValidaciones.INDIC_PROPIEDAD_TERCEROS || this._indicadorPropXPlanta == textValidaciones.INDIC_PROPIEDAD_PROPIOS) {
                        this.getView().byId("cb_tipoDescarga").setEnabled(false);
                    }
                }
                else {
                    this.getView().byId("FechaEnvaseIni").setVisible(true);
                }

                if (this._indicadorProp == textValidaciones.INDIC_PROPIEDAD_PROPIOS) {
                    this.getView().byId("fe_stockCombustible").setVisible(true);
                }

                if (this._listaEventos[this._elementAct].EstaOperacion != null
                    && this._listaEventos[this._elementAct].EstaOperacion == "L") {
                    this.getView().byId("fe_motivoLimitacion").setVisible(true);
                }
            } else if (this._tipoEvento == textValidaciones.TIPOEVENTOCALA && this._indicadorProp == textValidaciones.INDIC_PROPIEDAD_PROPIOS) {
                this.getView().byId("0003").setVisible(true);
                this.getView().byId("fe_temperaturaMar").setVisible(true);

            } else if (this._tipoEvento == textValidaciones.TIPOEVENTOHOROMETRO && this._indicadorProp == textValidaciones.INDIC_PROPIEDAD_PROPIOS
                || this._tipoEvento == textValidaciones.TIPOEVENTOTRASVASE && this._indicadorProp == textValidaciones.INDIC_PROPIEDAD_PROPIOS) {

                this.getView().byId("0003").setVisible(true);
                this.getView().byId("fe_stockCombustible").setVisible(true);
            }

            //Mostrar Sistema frio
            if (this._indicadorProp == textValidaciones.INDIC_PROPIEDAD_PROPIOS) {

                if (this._tipoPreservacion != "" && this._tipoPreservacion != "4") {
                    if (this._tipoEvento != "H" && this._tipoEvento != "T") {
                        if (Number(this._tipoEvento) < 6) {
                            this.getView().byId("fe_sistema_frio").setVisible(true);
                            this._opSistFrio = true;
                        }


                    } else {
                        this.getView().byId("fe_sistema_frio").setVisible(false);
                        this._opSistFrio = false;
                    }

                } else {
                    this.getView().byId("fe_sistema_frio").setVisible(false);
                    this._opSistFrio = false;
                }
            }

            //Observaciones adicionales
            if (this._listaEventos[this._elementAct].ObseAdicional != "") {
                this.getView().byId("fe_observacioAdic").setVisible(true);
            }

            //Tab Equipamiento
            if (this.buscarValorFijo(textValidaciones.EVEVISTABEQUIP, this._tipoEvento)) {
                if (this._indicadorProp == textValidaciones.INDIC_PROPIEDAD_PROPIOS) {
                    this.getView().byId("idEquipamiento").setVisible(true);
                }
            }

            //Tab Horometro        
            if (this.buscarValorFijo(textValidaciones.EVEVISTABHOROM, this._tipoEvento)
                && this._indicadorProp == textValidaciones.INDIC_PROPIEDAD_PROPIOS) {
                this.getView().byId("idHorometro").setVisible(true);
            }

            //Tab Pesca Declarada
            if (this.buscarValorFijo(textValidaciones.EVEVISTABPEDCL, this._tipoEvento)) {
                this.getView().byId("idPescaDecl").setVisible(true);
                //wdContext.currentVisibleElement().setBtnRowPescaDeclarada(WDVisibility.VISIBLE); -->ELEMENTO NO ENCONTRADO A UTILIZAR

                if (this._motivoMarea == "1") {
                    this.getView().byId("clm_moda_pescDecl").setVisible(true);
                }
            }

            //Tab Pesca Biometria
            if (this.buscarValorFijo(textValidaciones.EVEVISTABBIOME, this._tipoEvento)) {
                if (this._indicadorPropXPlanta != textValidaciones.INDIC_PROPIEDAD_TERCEROS) {
                    this.getView().byId("idBiometria").setVisible(true);
                }

            }

            //Tab Pesca Descargada
            if (this.buscarValorFijo(textValidaciones.EVEVISTABPEDSC, this._tipoEvento)) {
                this.getView().byId("idPescaDesc").setVisible(true);
                this.getView().byId("ext_pesc_desc").setVisible(true);

                if (this._indicadorPropXPlanta == textValidaciones.INDIC_PROPIEDAD_TERCEROS) { //Descarga en planta tercera
                    this.getView().byId("table_pesc_desc_especie").setVisible(true);
                } else if (this._indicadorPropXPlanta == textValidaciones.INDIC_PROPIEDAD_PROPIOS) { //Descarga en planta propia
                    if (this._motivoMarea == "1") {
                        this.getView().byId("table_pesc_desc_CHD").setVisible(true);
                    } else {
                        this.getView().byId("table_pesc_desc_ticket").setVisible(true);
                    }

                    if (nuevoEvento) {
                        this.getView().byId("pdt_col_BuscarDesc").setVisible(true);
                        this.getView().byId("pdCHD_col_BuscarDesc").setVisible(true);
                    }
                }

                if (!nuevoEvento) {
                    this.getView().byId("pdt_col_EliminarDesc").setVisible(false); //cambiar a false
                    this.getView().byId("pde_col_EliminarDesc").setVisible(false);
                    this.getView().byId("pdCHD_col_EliminarDesc").setVisible(false);
                    this.getView().getModel("eventos").setProperty("/enabledFechProdDesc", false);
                }
            }

            //Tab Distribucion
            if (this._tipoEvento == textValidaciones.TIPOEVENTOCALA && this._motivoMarea == "1") {
                this.getView().byId("FechaEnvaseIni").setVisible(true);
                this.getView().byId("col_porc_pesc_desc").setVisible(true);
                this.getView().byId("ext_pesca_declarada").setVisible(true);

                this.getView().getModel("eventos").setProperty("/enabledCantPescDeclarada", false);
                this.getView().byId("idDistribucion").setVisible(true);
            }

            //Tab Siniestro
            if (this._tipoEvento == textValidaciones.TIPOEVENTOSINIESTRO) {
                this.getView().byId("FechaEnvaseIni").setVisible(true);
                this.getView().byId("idSiniestro").setVisible(true);
                this.getView().byId("ext_siniestro").setVisible(true);
            }

            //Tab Accidente
            if (this._tipoEvento == textValidaciones.TIPOEVENTOACCIDENTE) {
                this.getView().byId("FechaEnvaseIni").setVisible(true);
                this.getView().byId("idAccidente").setVisible(true);
            }

            if ((!nuevoEvento && (this._elementAct < (this._listaEventos.length - 1)))
                || this._soloLectura || (this._FormMarea.EstMarea == "C" && this._FormMarea.EstCierre != "")) {

                this.prepararVistaRevision();

                if (this._soloLectura) {
                    this.getView().byId("pdt_col_BuscarDesc").setVisible(false);
                    this.getView().byId("pdCHD_col_BuscarDesc").setVisible(false);

                    this.getView().byId("pdt_col_EliminarDesc").setVisible(false);
                    this.getView().byId("pde_col_EliminarDesc").setVisible(false);
                    this.getView().byId("pdCHD_col_EliminarDesc").setVisible(false);

                    this.getView().byId("ext_siniestro").setVisible(false);
                    this.getView().getModel("eventos").setProperty("/enabledFechProdDesc", false);
                }
            }

            if (!this._soloLectura) {
                //Datos de operacion
                if (this._indicadorProp == textValidaciones.INDIC_PROPIEDAD_PROPIOS) {
                    this.getView().byId("i_stockCombustible").setEnabled(true);
                }

                //Tab Distribucion
                if (this._tipoEvento == textValidaciones.TIPOEVENTOCALA && this._motivoMarea == "1") {
                    this.getView().byId("FechaEnvaseIni").setVisible(true);
                    this.getView().getModel("eventos").setProperty("/enabledBodCantpesca", true);
                }
            }

            if (this._mareaReabierta) {

                var fechHoraAct = new Date();
                var fecCierre = this._FormMarea.FecCierre;
                var horCierre = this._FormMarea.HorCierre;

                var fechHoraIni = new Date(fecCierre + " " + horCierre);
                var hour24 = 24 * 3600 * 1000;
                var miliFecHoraAct = fechHoraAct.getTime();
                var miliFechHoraIni = fechHoraIni.getTime();
                var miliDuracion = Number(miliFechHoraIni) + Number(hour24);

                if (this._IsRolRadOpe) {
                    if (miliDuracion <= miliFecHoraAct && this._listaEventos[this._elementAct].ListaHorometros.length > 0) {
                        this.getView().byId("i_stockCombustible").setEnabled(false);
                        for (var j = 0; j < this._listaEventos[this._elementAct].ListaHorometros.length; j++) {
                            this._listaEventos[this._elementAct].ListaHorometros[j].readOnly = false;
                            //nodeHorometros.currentHorometrosElement().setReadOnly(true); --> seteo por cada elemento de la tabla de horometro
                        }
                    }

                }

                if (this._IsRolIngComb) {
                    // formCust.wdGetContext().currentReadOnlyElement().setObservacion(true);
                    // formCust.wdGetContext().currentReadOnlyElement().setFecHoraArribo(true);
                    // formCust.wdGetContext().currentReadOnlyElement().setEstMarea(true);  --- > viene por parte de alejandro mapear en su componente

                    this.getView().byId("ip_sistema_frio").setEnabled(false);
                    this.getView().byId("ip_observacion").setEnabled(false);
                    this.getView().getModel("eventos").setProperty("/enabledAveriado", false);
                    this.getView().getModel("eventos").setProperty("/enabledCantEquipamiento", false);
                    this.getView().byId("ip_muestra").setEnabled(false);
                    this.getView().getModel("eventos").setProperty("/enabledBodCantpesca", false);
                    this.getView().getModel("eventos").setProperty("/enabledCantPescDescargada", false);
                    this.getView().getModel("eventos").setProperty("/enabledCantPescDeclDesc", false);
                }
            }


        },
        mngBckEventos: function (respaldar) {
            if (respaldar) {
                this._listaEventosBkup = this._listaEventos;
            } else {
                this._listaEventos = this._listaEventosBkup;
            }

        },

        obtenerEquipamiento: function () {
            if (this._listasServicioCargaIni[1] ? true : false) {
                this._listaEventos[this._elementAct].ListaEquipamiento = JSON.parse(this._listasServicioCargaIni[1]).data;
            }

        },
        obtenerCoordZonaPesca: function () {
            if (this._listasServicioCargaIni[2] ? true : false) {
                let elementoCoordZonaPesca = JSON.parse(this._listasServicioCargaIni[2]).data[0];
                this._listaEventos[this._elementAct].ZPLatiIni = elementoCoordZonaPesca.LTMIN;
                this._listaEventos[this._elementAct].ZPLatiFin = elementoCoordZonaPesca.LTMAX;
                this._listaEventos[this._elementAct].ZPLongIni = elementoCoordZonaPesca.LNMIN;
                this._listaEventos[this._elementAct].ZPLongFin = elementoCoordZonaPesca.LNMAX;
                //wdContext.currentEventosElement().setDescLatiLongZonaPesca(descLatiLong);
            }

        },

        obtenerPescaDeclarada: function () {
            let sumaCantPesca = Number(0);
            if (this._listasServicioCargaIni[3] ? true : false) {
                this._listaEventos[this._elementAct].ListaPescaDeclarada = JSON.parse(this._listasServicioCargaIni[3]).data
                for (var j = 0; j < this._listaEventos[this._elementAct].ListaPescaDeclarada.length; j++) {

                    sumaCantPesca = sumaCantPesca + Number(this._listaEventos[this._elementAct].ListaPescaDeclarada[j].CNPCM);
                }

                this._listaEventos[this._elementAct].CantTotalPescDecla = sumaCantPesca;
            }

        },
        obtenerBodegas: function () {
            if (this._listasServicioCargaIni[4] ? true : false) {
                this._listaEventos[this._elementAct].ListaBodegas = JSON.parse(this._listasServicioCargaIni[4]).data;
                //this._ListaBodegas = JSON.parse(this._listasServicioCargaIni[4]).data;
            }

        },

        obtenerPescaBodega: function () {
            if (this._listasServicioCargaIni[5] ? true : false) {
                for (var j = 0; j < this._listaEventos[this._elementAct].ListaBodegas.length; j++) {
                    try {
                        let listaPescaBodega1 = JSON.parse(this._listasServicioCargaIni[5]).data;
                        for (var n = 0; n < listaPescaBodega1.length; n++) {
                            if (listaPescaBodega1[n].CDBOD == this._listaEventos[this._elementAct].ListaBodegas[j].CDBOD) {
                                this._listaEventos[this._elementAct].ListaBodegas[j].Indicador = "E";
                                this._listaEventos[this._elementAct].ListaBodegas[j].CantPesca = listaPescaBodega1[n].CNPCM;
                                break;
                            }
                        }
                    } catch (error) {

                    }
                }
                if (this._listaEventos[this._elementAct].CantTotalPescDecla > 0) {
                    for (var j = 0; j < this._listaEventos[this._elementAct].ListaPescaDeclarada.length; j++) {
                        let porcPesca = Number(0);
                        let cantPesca = Number(this._listaEventos[this._elementAct].ListaPescaDeclarada[j].CNPCM);
                        porcPesca = (cantPesca * 100) / Number(this._listaEventos[this._elementAct].CantTotalPescDecla);
                        this._listaEventos[this._elementAct].ListaPescaDeclarada[j].PorcPesca = porcPesca;
                    }
                }
            }

        },
        obtenerPuntosDescarga: function () {
            if (this._listasServicioCargaIni[6] ? true : false) {
                this._cmbPuntosDescarga = JSON.parse(this._listasServicioCargaIni[6]).data;
            }

        },

        obtenerPescaDescargada: function () {
            if (this._listasServicioCargaIni[7] ? true : false) {
                this._listaEventos[this._elementAct].ListaPescaDescargada = JSON.parse(this._listasServicioCargaIni[7]).data;
                this._listaEventos[this._elementAct].FechProduccion = this._listaEventos[this._elementAct].ListaPescaDescargada[0].FECCONMOV;
            }

        },
        obtenerHorometros: function () {
            if (this._listasServicioCargaIni[8] ? true : false) {
                this._listaEventos[this._elementAct].ListaHorometros = this._listasServicioCargaIni[8].lista;
            }

        },
        obtenerCantTotalPescaDecla: function (nroEventoTope) {
            let cantTotal = Number[0];
            for (var j = 0; j < this._listaEventos.length; j++) {
                if (this._tipoEvento == textValidaciones.TIPOEVENTOCALA) {
                    if (this._listaEventos[j].Numero == this._nroEvento) {
                        if (this._listaEventos[j].CantTotalPescDecla != null) {
                            cantTotal = cantTotal + Number[this._listaEventos[j].CantTotalPescDecla];
                        }
                    } else {
                        this.obtenerDetalleEvento();

                        cantTotal = cantTotal + Number[this._listaEventos[j].CantTotalPescDecla];
                    }
                }

                if (this._listaEventos[j].Numero == nroEventoTope) {
                    break;
                }
            }
            return cantTotal;

        },
        obtenerCantTotalPescaDeclDesc: function (nroEventoTope) {
            let cantTotal = Number[0];
            for (var j = 0; j < this._listaEventos.length; j++) {
                if (this._tipoEvento == textValidaciones.TIPOEVENTODESCARGA) {
                    this.getView().byId("FechaEnvaseIni").setVisible(false);
                    this.getView().byId("FechaEnvaseFin").setVisible(false);
                    if (this._listaEventos[j].Numero == this._nroEvento) {
                        if (this._listaEventos[j].ListaPescaDescargada[0].CantPescaDeclarada ? true : false) {
                            cantTotal = cantTotal + Number[this._listaEventos[j].ListaPescaDescargada[0].CantPescaDeclarada];
                        }
                    } else {
                        this.obtenerDetalleEvento();
                        if (this._listaEventos[j].ListaPescaDescargada[0] ? true : false) {
                            if (this._listaEventos[j].ListaPescaDescargada[0].CantPescaDeclarada ? true : false){
                                cantTotal = cantTotal + Number[this._listaEventos[j].ListaPescaDescargada[0].CantPescaDeclarada];
                            }
                            
                        }
                    }
                }

                if (this._listaEventos[j].Numero == nroEventoTope) {
                    break;
                }
            }
            return cantTotal;

        },
        validarEsperaEventoAnterior: function(){
            let bOk = true;
            let elemAnt = Number(this._elementAct) - 1;
            let limiteMin = Number(this._ConfiguracionEvento.EspeMiliLimMinimo);
	        let limiteMax = Number(this._ConfiguracionEvento.EspeMiliLimMaximo);
            let exisEspMarAnt = this._EsperaMareaAnt.length > 0;
            if(this._ConfiguracionEvento.EspeUMExtValido){
                if(Number(this._elementAct) > 0){
                    let fechaIni = this._listaEventos[this._elementAct].FechIni;
				    let horaIni =  this._listaEventos[this._elementAct].HoraIni;

                    let tipoEventoAnt = this._listaEventos[elemAnt].TipoEvento;
                    let fechaFin = this._listaEventos[elemAnt].FechIni;
                    let horaFin = this._listaEventos[elemAnt].HoraIni;

                    if (this.buscarValorFijo(textValidaciones.EVEVISTABFECHAFIN, tipoEventoAnt)) {
                        fechaFin = this._listaEventos[elemAnt].FechFin;
                        horaFin = this._listaEventos[elemAnt].HoraFin;	
                    }	
                    let fechHoIni = new Date(fechaIni + " " + horaIni);
                    let miliFecHoIni = fechHoIni.getTime();
                    let fechHoFin = new Date(fechaFin + " " + horaFin);
                    let miliFecHoFin = fechHoFin.getTime();
                    
                    let tiempo = Number(miliFecHoFin) - Number(miliFecHoIni);
                    
                    if (tiempo > limiteMin && tiempo <= limiteMax) {	
                        bOk = false;
                         
                        let mssg = this.oBundle.getText("SUPLIMMINESPERA");
                        MessageBox.error(mssg);
                        textValidaciones.EspMareaAct = true;
                        //wdThis.wdFireEventCrearEventoEspera();
                    } else if (tiempo > limiteMax) {
                        bOk = false;

                        let mssg1 = this.oBundle.getText("SUPLIMMINESPERA");
                        let mssg2 = this.oBundle.getText("TEXTCERRARMARE");
                        MessageBox.error(mssg1 + " " + mssg2);
                    }
                }
                else if (this._indicadorProp =="P") {
                    if (!this._FormMarea.EsNuevo) {
                        // wdThis.wdGetFormCustController().obtenerDatosMareaAnt(wdContext.currentFormElement().getMarea(), 
                        //     wdContext.currentFormElement().getEmbarcacion());
                    }
                                
                    let motivoMareaAnt = this._listaMareaAnterior.MotMarea;	
                                    
                    if (motivoMareaAnt != "" && this.buscarValorFijo(textValidaciones.MOTIVOMARPESCA, motivoMareaAnt)) {
                        let fechaFin = null;
                        let horaFin = null;
                        let fechaIni = null;
                        let horaIni = null;
                        let tiempo = 0;
                        
                        if (!this.buscarValorFijo(textValidaciones.MOTIVOSINZARPE, motivoMareaAnt)) {		
                            let tipoEvento = this._listaMareaAnterior.EventosMareaAnt.TipoEvento;
    
                            fechaIni = this._listaEventos[this._elementAct].FechIni;
                            horaIni  = this._listaEventos[this._elementAct].HoraIni;
                            
                            if (exisEspMarAnt) {
                                fechaFin = this._EsperaMareaAnt[0].FechFin;
                                horaFin  = this._EsperaMareaAnt[0].HoraFin;
                            } else {
                                if (this.buscarValorFijo(textValidaciones.EVEVISTABFECHAFIN, tipoEvento)) {
                                    fechaFin = this._listaMareaAnterior.EventosMareaAnt.FechFin;
                                    horaFin = this._listaMareaAnterior.EventosMareaAnt.HoraFin;	
                                } else {
                                    fechaFin = this._listaMareaAnterior.EventosMareaAnt.FechIni;
                                    horaFin = this._listaMareaAnterior.EventosMareaAnt.HoraIni;
                                }
                            }
                            let fechHoIni = new Date(fechaIni + " " + horaIni);
                            let miliFecHoIni = fechHoIni.getTime();
                            let fechHoFin = new Date(fechaFin + " " + horaFin);
                            let miliFecHoFin = fechHoFin.getTime();
                                                
                            tiempo = Number(miliFecHoFin) - Number(miliFecHoIni);
                            
                            textValidaciones.EspMareaAct = true;
                            
                            textValidaciones.FechFinEspera = fechaFin;
                            textValidaciones.HoraFinEspera = horaFin;
                
                            if (tiempo > limiteMin && tiempo <= limiteMax) {
                                bOk = false;
                                
                                if (!exisEspMarAnt) {
                                    //wdThis.wdFireEventCrearEventoEspera();
                                    let mssg = this.oBundle.getText("SUPLIMMINESPERA");
                                    MessageBox.error(mssg);
                                    textValidaciones.EspMareaAct = true;
                                } else {
                                    let mssg1 = this.oBundle.getText("SUPLIMMINESPERA");
                                    let mssg2 = this.oBundle.getText("TEXTCERRARMARE");
                                    MessageBox.error(mssg1 + " " + mssg2);
                                }
                            } else if (tiempo > limiteMax) {
                                bOk = false;
                                
                                let mssg1 = this.oBundle.getText("SUPLIMMINESPERA");
                                let mssg2 = this.oBundle.getText("TEXTCERRARMARE");
                                MessageBox.error(mssg1 + " " + mssg2);
                            } 
                            
                            if (!bOk && exisEspMarAnt) {
                                this._EsperaMareaAnt = [];
                            }
                        }
                    } else {
                        let mssg = this.oBundle.getText("NOEXISTDATAMARANT");
                        MessageBox.error(mssg);
                    }
                }
            }
            return bOk;
        },
        validarDatosEspera: function(){
            let fechaIni = this._listaEventos[this._elementAct].FechIni;
            let horaIni = this._listaEventos[this._elementAct].HoraIni;
            let fechaFin = this._listaEventos[this._elementAct].FechFin;
            let horaFin = this._listaEventos[this._elementAct].HoraFin;
            let fechHorIni = new Date(fechaIni + " " + horaIni);
            let fechHorFin = new Date(fechaFin + " " + horaFin);
            let esperaMin = Number(this._ConfiguracionEvento.EspeMiliLimMinimo);
            let esperaMax = Number(this._ConfiguracionEvento.EspeMiliLimMaximo);
            let horaFeI = Number(fechHorIni.getHours())*60*60*60 + Number(fechHorIni.getMinutes())*60*60 + Number(fechHorIni.getSeconds())*60;
            let fechaMin = new Date(fechHorIni.getTime() + esperaMin);
            let horaMin = this.msToTime(horaFeI + esperaMin);
            let fechaMax = new Date(fechHorIni.getTime() + esperaMax);
            let horaMax = this.msToTime(horaFeI + esperaMax);
            //________________________________________________________________//
            let todayDate = new Date().toISOString().slice(0, 10);
            let fchHoy = "" + todayDate;
            let fechHorMin = new Date(fchHoy + " " + this.msToTime(horaFeI + esperaMin));
            let fechHorMax = new Date(fchHoy + " " + this.msToTime(horaFeI + esperaMax));
            let fechHoraAct = new Date();
            //contextEvento
            
            if (fechHorIni > fechHorFin) {
                let mssg1 = this.oBundle.getText("FECHAINIEVEMENOFECHAFIN");
                MessageBox.error(mssg1);
            } else if (fechHoraAct > fechHorFin) {
                let mssg1 = this.oBundle.getText("FECHAFINEVEMENOFECHACT");
                MessageBox.error(mssg1);
            } else if (fechHorMin > fechHorFin) {		
                let mssg1 = this.oBundle.getText("FECFINNOMENLIMMIN");
                MessageBox.error(mssg1 + " " + fechaMin + " " + horaMin);
                this._listaEventos[this._elementAct].FechFin = fechaMin;
                this._listaEventos[this._elementAct].HoraFin = horaMin;
            } else if (fechHorFin.after(fechHorMax)) {
                let mssg1 = this.oBundle.getText("FECFINNOMAYLIMMAX");
                MessageBox.error(mssg1 + " " + fechaMax + " " + horaMax);
                this._listaEventos[this._elementAct].FechFin = fechaMax;
                this._listaEventos[this._elementAct].HoraFin = horaMax;
            } else {
                //bOk = true;
                return true;
            }
            
            return false;

        },
        msToTime:function(duration) {
            var milliseconds = Math.floor((duration % 1000) / 100),
              seconds = Math.floor((duration / 1000) % 60),
              minutes = Math.floor((duration / (1000 * 60)) % 60),
              hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
          
            hours = (hours < 10) ? "0" + hours : hours;
            minutes = (minutes < 10) ? "0" + minutes : minutes;
            seconds = (seconds < 10) ? "0" + seconds : seconds;
          
            return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
          },
        removerEvento_button:function(){
            this.Dat_Horometro.onActionRemoverEvento();
        },
        descartarCambios_button(){
            this.Dat_Horometro.onActionDescartarCambios()
        },

        onActionCalcCantPescaDecla: function () {
            var eventoActual = this._listaEventos[this._elementAct]; //modelo del evento actual
            var cantPescaDec = eventoActual.ListaPescaDeclarada.length;
            var cantTotal = eventoActual.CantTotalPescDecla;
            var pescaDecla = eventoActual.ListaPescaDeclarada;
            for (let index = 0; index < pescaDecla.length; index++) {
                const element = pescaDecla[index];
                var porcPesca = element.PorcPesca;
                element.Editado = true;
                element.PorcPesca = porcPesca;
                element.CantPesca = cantTotal * (porcPesca * 0.01);
            }
            this.getView().getModel("eventos").updateBindings(true);
            //refrescar modelo
        },

        prepararVistaRevision: function () {
            this.getView().byId("cb_ZonaPesca").setEnabled(false);
            this.getView().byId("dtp_fechaIniCala").setEnabled(false);
            this.getView().byId("dtf_fechaIniEnv").setEnabled(false);
            this.getView().byId("dtf_FechaProduccion").setEnabled(false);
            this.getView().byId("dtp_fechaFinCala").setEnabled(false);
            this.getView().byId("dtf_fechaFinEnv").setEnabled(false);
            this.getView().byId("cmb_estaOperacion").setEnabled(true);//cambiar a false
            this.getView().byId("cb_tipoDescarga").setEnabled(false);
            this.getView().byId("i_temperaturaMar").setEnabled(false);
            this.getView().byId("i_stockCombustible").setEnabled(false);
            this.getView().byId("ip_muestra").setEnabled(false);
            this.getView().byId("ip_sistema_frio").setEnabled(false);
            this.getView().byId("cmb_motivoLim").setEnabled(false);
            this.getView().byId("cmb_motivoEspera").setEnabled(false);
            this.getView().byId("ip_observacion").setEnabled(false);
            this.getView().byId("ip_latitud1").setEnabled(false);
            this.getView().byId("ip_latitud2").setEnabled(false);
            this.getView().byId("ip_longitud1").setEnabled(false);
            this.getView().byId("ip_longitud2").setEnabled(false);

            this.getView().getModel("products").setProperty("enabledEspecie", false);
            this.getView().getModel("eventos").setProperty("/enabledBodCantpesca", false);

        },
        //------METODOS ALEJANDRO-------------
        validarCantPescaDeclDesc : function() {
            var bOk = true;
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            var DetalleMarea = this._FormMarea;//modelo detalle de marea
            var eventoActual = this._listaEventos[this._elementAct];//modelo evento actual
            var indActual = this._elementAct;
            var nroEventoTope = this._nroEvento;
            var cantTotalDecl = 0;
            var cantTotalDeclDesc = 0;
            for (let index = (indActual + 1); index <  this._listaEventos.length; index++) {
                const element = array[index];
                nroEventoTope = element.Numero;
                if(element.TipoEvento == "1"){
                    break;
                }
            }
            cantTotalDecl = this.obtenerCantTotalPescaDecla(nroEventoTope);
            cantTotalDeclDesc =this.obtenerCantTotalPescaDeclDesc(nroEventoTope);
            if(cantTotalDecl > cantTotalDeclDesc){
                var mensaje = this.oBundle.getText("PESCDECDESCMAYPESCDEC");
                MessageBox.error(mensaje);
                bOk=false;
            }


            return bOk;
        },

        validarCambios: function(){
            var bOk = this.Dat_PescaDescargada.validarDatosEvento();
            var detalleMarea = this._FormMarea;//modelo detalle marea
            if(!bOk){
                var mensaje = this.oBundle.getText("DISCCHANEVENTMESSAGE");
                MessageBox.error(mensaje);
                this.Dat_Horometro.mostrarEnlaces();
            }else{
                detalleMarea.FormEditado = true;
            }
            this.getView().getModel("eventos").updateBindings(true);
            //refresh model
        },

        validarDatos: function(){
            var DataSession = {};//modelo data session
            var visible = textValidaciones.visible;//modelo visible
            var eventoActual = this._listaEventos[this._elementAct]; //nodo evento actual
            var detalleMarea = this._FormMarea;//modelo detalle marea
            var isRolIngComb = DataSession.IsRolIngComb;
            if(eventoActual.TipoEvento == "6"){
                visible.VisibleDescarga = false;
                visible.FechFin = false;
            }else{
                visible.VisibleDescarga = true;
            }

            var validarMareaEventos = this.validarMareaEventos();
            var validarDatosEvento = this.Dat_PescaDescargada.validarDatosEvento();
            if(validarMareaEventos){
                if(validarDatosEvento && !detalleMarea.TieneErrores){
                    if(isRolIngComb){
                        visible.VisibleObsvComb = true;              
                    }else{
                        visible.VisibleObsvComb = true;
                    }
                    this.getDialog().open();
                }
            }
        },

        getDialog: function(){
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment("com.tasa.registroeventospescav2.fragments.Confirm", this);
                this.getView().addDependent(this.oDialog);
            }
            return this.oDialog;
        },
        validarMareaEventos:function(){
            let motMarea = this._motivoMarea;
    
            if (!this.buscarValorFijo(textValidaciones.MOTIVOSINZARPE, motMarea)) {
                if (this._listaEventos != null) {
                    for (let i = 0; i < this._listaEventos.length; i++){
                        
                        if (this._listaEventos[i].TipoEvento == "1") { // Valido si existe al menos un evento de zarpe
                            return true;
                        }
                    }
                }
                var mensaje = this.oBundle.getText("NOEXISTEZARPE");
                MessageBox.error(mensaje);

            } else {
                return true;
            }
            
            return false;
        },
        //-----------------------------

        resetView: function () {
            this.getView().byId("cb_ZonaPesca").setEnabled(false);
            this.getView().byId("dtp_fechaIniCala").setEnabled(false);
            this.getView().byId("dtf_fechaIniEnv").setEnabled(false);
            this.getView().byId("dtf_FechaProduccion").setEnabled(false);
            this.getView().byId("dtp_fechaFinCala").setEnabled(false);
            this.getView().byId("dtf_fechaFinEnv").setEnabled(false);
            this.getView().byId("cmb_estaOperacion").setEnabled(false);//cambiar a false
            this.getView().byId("cb_tipoDescarga").setEnabled(false);
            this.getView().byId("i_temperaturaMar").setEnabled(false);
            this.getView().byId("i_stockCombustible").setEnabled(false);
            this.getView().byId("ip_muestra").setEnabled(false);
            this.getView().byId("ip_sistema_frio").setEnabled(false);
            this.getView().byId("cmb_motivoLim").setEnabled(false);
            this.getView().byId("cmb_motivoEspera").setEnabled(false);
            this.getView().byId("ip_observacion").setEnabled(false);
            this.getView().byId("ip_latitud1").setEnabled(false);
            this.getView().byId("ip_latitud2").setEnabled(false);
            this.getView().byId("ip_longitud1").setEnabled(false);
            this.getView().byId("ip_longitud2").setEnabled(false);

            this.getView().getModel("eventos").setProperty("/enabledBodCantpesca", false);
            this.getView().getModel("eventos").setProperty("/enabledCantPescDeclarada", false);
            this.getView().getModel("eventos").setProperty("/enabledCantPescDescargada", false);
            this.getView().getModel("eventos").setProperty("/enabledCantPescDeclDesc", false);
            this.getView().getModel("eventos").setProperty("/enabledPuntoDescarga", false);
            this.getView().getModel("eventos").setProperty("/enabledFechProdDesc", false);
            this.getView().getModel("eventos").setProperty("/enabledAveriado", false);
            this.getView().getModel("eventos").setProperty("/enabledCantEquipamiento", false);

            this.getView().byId("FechaEnvaseIni").setVisible(false);
            this.getView().byId("FechaEnvaseFin").setVisible(false);
            this.getView().byId("fe_Empresa").setVisible(false);
            this.getView().byId("btn_Planta").setVisible(false);
            this.getView().byId("fe_ZonaPesca").setVisible(false);
            this.getView().byId("f_LatitudLongitud").setVisible(false);
            this.getView().byId("fe_muestra").setVisible(false);
            this.getView().byId("fe_fechaIniCala").setVisible(false);
            this.getView().byId("fe_fechaFinCala").setVisible(false);
            this.getView().byId("fe_FechaProduccion").setVisible(false);
            this.getView().byId("fe_fechaArribo").setVisible(false);
            this.getView().byId("fe_MotiNoPesca").setVisible(false);
            this.getView().byId("0004").setVisible(false);
            this.getView().byId("0003").setVisible(false);
            this.getView().byId("fe_estadoOperacion").setVisible(false);
            this.getView().byId("fe_tipoDescarga").setVisible(false);
            this.getView().byId("fe_stockCombustible").setVisible(false);
            this.getView().byId("fe_motivoLimitacion").setVisible(false);
            this.getView().byId("fe_temperaturaMar").setVisible(false);
            this.getView().byId("fe_sistema_frio").setVisible(false);
            this.getView().byId("fe_observacioAdic").setVisible(false);
            this.getView().byId("clm_moda_pescDecl").setVisible(false);
            this.getView().byId("ext_pesc_desc").setVisible(false);
            this.getView().byId("table_pesc_desc_especie").setVisible(false);
            this.getView().byId("table_pesc_desc_CHD").setVisible(false);
            this.getView().byId("table_pesc_desc_ticket").setVisible(false);
            this.getView().byId("pdt_col_BuscarDesc").setVisible(false);
            this.getView().byId("pdCHD_col_BuscarDesc").setVisible(false);
            this.getView().byId("pdt_col_EliminarDesc").setVisible(true);
            this.getView().byId("pde_col_EliminarDesc").setVisible(false);
            this.getView().byId("pdCHD_col_EliminarDesc").setVisible(false);
            this.getView().byId("col_porc_pesc_desc").setVisible(false);
            this.getView().byId("ext_pesca_declarada").setVisible(false);
            this.getView().byId("ext_siniestro").setVisible(false);

        },

        getCurrentUser: function () {
            return "FGARCIA";
        },

	});
});