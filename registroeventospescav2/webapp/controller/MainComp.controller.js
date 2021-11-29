sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "./FormCust",
    "./Utils",
    "../Service/TasaBackendService",
], function (Controller, FormCust, Utils, TasaBackendService) {
    "use strict";

    return Controller.extend("com.tasa.registroeventospescav2.controller.MainComp", {

        existeHormAveriados: false,
        horometrosAveriados: {},

        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter : function () {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel : function (sName) {
            return sap.ui.getCore().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel : function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle : function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        
        /**
         * Metodo para inicializar variables
         */
        wdDoInit: function(){
            
        },

        getCurrentUser: function(){
            return "FGARCIA"
        },

        FormCust: function(){
            return new FormCust;
        },

        guardarCambios: async function(){
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var motivoMarea = modelo.getProperty("/Cabecera/CDMMA");
            var estadoMarea = modelo.getProperty("/DatosGenerales/ESMAR");
            var indPropiedad = modelo.getProperty("/DatosGenerales/INPRP");
            var mareaReabierta = false;
            var eventos = modelo.getProperty("/Eventos/Lista");
            var eventoIni = null;
	        var eventoFin = null;
	        var tipoEventoIni = null;
	        var tipoEventoFin = null;
            var motivoSinZarpe = ["3", "7", "8"];
            if(motivoSinZarpe.includes(motivoMarea)){
                var plantaDistrFlota = modelo.getProperty("/DistribFlota/CDPTA");
                modelo.setProperty("/Cabecera/CDPTA", plantaDistrFlota);
            }else{
                eventoIni = eventos[0];
                eventoFin = eventos[eventos.length - 1];
                tipoEventoIni = eventoIni.CDTEV;
                tipoEventoFin = eventoFin.CDTEV;
                modelo.setProperty("/Cabecera/CDPTA", eventoFin.CDPTA);
                modelo.setProperty("/DatosGenerales/FIMAR", eventoIni.FIEVN);
                modelo.setProperty("/DatosGenerales/HIMAR", eventoIni.HIEVN);
            }

            if(estadoMarea == "C"){
                if(!mareaReabierta){
                    modelo.setProperty("/Cabecera/ESCMA", "T");
                }
                if(!motivoSinZarpe.includes(motivoMarea)){
                    var fechaActual = new Date();
                    var eveVisFechaFin = ["3", "6", "7"];
                    if(eveVisFechaFin.includes(tipoEventoFin)){
                        modelo.setProperty("/DatosGenerales/FFMAR", eventoFin.FFEVN);
                        modelo.setProperty("/DatosGenerales/HFMAR", eventoFin.HFEVN);
                    }else{
                        modelo.setProperty("/DatosGenerales/FFMAR", eventoFin.FIEVN);
                        modelo.setProperty("/DatosGenerales/HFMAR", eventoFin.HIEVN);
                    }
                    if (!mareaReabierta) {
                        var existeDesc = false;
                        for (let index = eventos.length; index > 0; index--) {
                            const element = eventos[index];
                            if(element.CDTEV == "6"){
                                existeDesc = true;
                                var fechaContabilizacion = Utils.strDateToDate("");//pasar fecha de contabilizacion de modelo pesca descargada
                                if((fechaContabilizacion.getTime() - fechaActual.getTime()) >= 0){
                                    modelo.setProperty("/Cabecera/ESCMA", "P");
                                }
                            }
                        }
                        if(!existeDesc && indPropiedad == "P" && !motivoSinZarpe.includes(motivoMarea)){
                            modelo.setProperty("/Cabecera/ESCMA", "P");
                        }
                    }
                }
            }

            await this.guardarMarea();
            //actualizar obs comb
        },

        guardarMarea: async function(){
            var guardarDatosMarea = await this.guardarDatosMarea();
            if(guardarDatosMarea){

            }
        },

        guardarDatosMarea: async function(){
            var bOk = true;
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var marea = {
                p_user: this.getCurrentUser(),
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
                CDMMA: modelo.getProperty("/Cabecera/CDMMA"),
                INUBC: modelo.getProperty("/DatosGenerales/INUBC"),
                FEARR: Utils.strDateToDate(modelo.getProperty("/DatosGenerales/FEARR")),
                HEARR: modelo.getProperty("/DatosGenerales/HEARR"),//Utils.strHourToSapHo(modelo.getProperty("/DatosGenerales/HEARR")),
                OBMAR: modelo.getProperty("/Cabecera/OBMAR"),
                ESMAR: modelo.getProperty("/DatosGenerales/ESMAR"),
                FEMAR: Utils.strDateToDate(modelo.getProperty("/DatosGenerales/FEMAR")),
                HAMAR: modelo.getProperty("/DatosGenerales/HAMAR"), //Utils.strHourToSapHo(modelo.getProperty("/DatosGenerales/HAMAR")),
                FIMAR: Utils.strDateToDate(modelo.getProperty("/DatosGenerales/FIMAR")),
                HIMAR: modelo.getProperty("/DatosGenerales/HIMAR"),//Utils.strHourToSapHo(modelo.getProperty("/DatosGenerales/HIMAR")),
                FFMAR: Utils.strDateToDate(modelo.getProperty("/DatosGenerales/FFMAR")),
                HFMAR: modelo.getProperty("/DatosGenerales/HFMAR"),//Utils.strHourToSapHo(modelo.getProperty("/DatosGenerales/HFMAR")),
                CDPTA: modelo.getProperty("/Cabecera/CDPTA"),
                ESCMA: modelo.getProperty("/Cabecera/ESCMA"),
                FCCRE: Utils.strDateToDate(modelo.getProperty("/Cabecera/FCCRE")),
                HRCRE: modelo.getProperty("/Cabecera/HRCRE"),//Utils.strHourToSapHo(modelo.getProperty("/Cabecera/HRCRE")),
                ATCRE: modelo.getProperty("/Cabecera/ATCRE"),
                FCMOD: Utils.strDateToDate(modelo.getProperty("/Cabecera/FCMOD")),
                HRMOD: modelo.getProperty("/Cabecera/HRMOD"),//Utils.strHourToSapHo(modelo.getProperty("/Cabecera/HRMOD")),
                ATMOD: modelo.getProperty("/Cabecera/ATMOD")
            };

            marea.str_marea.push(objMarea);
            var equipamientos = [];
            var horometros = [];
            var eventos = modelo.getProperty("/Eventos/Lista");
            for (let index = 0; index < eventos.length; index++) {
                var element = eventos[index];
                var evt = {
                    INDTR: "E",
                    NRMAR: element.NRMAR,
                    NREVN: element.NREVN,
                    CDTEV: element.CDTEV,
                    FIEVN: Utils.strDateToDate(element.FIEVN),
                    HIEVN: element.HIEVN,
                    FFEVN: Utils.strDateToDate(element.FFEVN),
                    HFEVN: element.HFEVN,
                    FICAL: Utils.strDateToDate(element.FICAL),
                    HICAL: element.HICAL,
                    FFCAL: Utils.strDateToDate(element.FFCAL),
                    HFCAL: element.HFCAL,
                    CDZPC: element.CDZPC,
                    CDPTO: element.CDPTO,
                    CDPTA: element.CDPTA,
                    CDEMP: element.CDEMP,
                    CDMNP: element.CDMNP,
                    ESOPE: element.ESOPE,
                    ESTSF: element.ESTSF,
                    CDMLM: element.CDMLM,
                    STCMB: element.STCMB,
                    LTGEO: element.LTGEO,
                    LNGEO: element.LNGEO,
                    TEMAR: element.TEMAR,
                    CDTDS: element.CDTDS,
                    TMESP: element.TMESP,
                    CDMES: element.CDMES,
                    MUEST: element.MUEST,
                    ESEVN: element.ESEVN,
                    FCEVN: Utils.strDateToDate(element.FCEVN),
                    HCEVN: element.HCEVN,
                    ACEVN: element.ACEVN,
                    FMEVN: Utils.strDateToDate(element.FMEVN),
                    HMEVN: element.HMEVN,
                    AMEVN: element.AMEVN,
                    NRDES: element.NRDES,
                    ESTSF: element.ESTSF,
                };

                equipamientos = this.obtenerEquipamientos(element);
                horometros = this.obtenerHorometros(element);

                marea.str_evento.push(evt);
            }

            marea.str_flbsp_c = this.guardarDatosBiometria();
            marea.str_flbsp_e = this.eliminarDatosBiometria();
            marea.str_pscinc = this.guardarDatosIncidental();
            marea.str_psbod = this.obtenerPescaBodega();
            marea.str_psdec = this.obtenerPescaDeclarada();

            console.log(eventos);
            var guardar = await TasaBackendService.crearActualizarMarea(marea);
        },

        obtenerEquipamientos: function(element){
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var listaEquipamientos = [];//modelo equipamientos del evento (element)
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

        obtenerHorometros: function(element){
            var horometros = []; //modelo de horometros de la lista de eventos (element)
            var lista = [];
            for (let index = 0; index < horometros.length; index++) {
                const element = horometros[index];
                var listHorometros = {
                    INDTR: element.INDTR,
                    NRMAR: element.NRMAR,
                    NREVN: element.NREVN,
                    CDTHR: element.CDTHR,
                    LCHOR: element.LCHOR,
                    NORAV: element.NORAV
                };
                lista.push(listHorometros);
            }
        },

        guardarDatosBiometria: function(){
            var biom_list = [];
            var ListaBiomTemp = [];//modelo de biometria Temp
            var ListaBiom = [];//modelo de biometria
            if(ListaBiom.length > 0){
                //this.cargarRegistroBiometria();
            }
            for (let index = 0; index < ListaBiomTemp.length; index++) {
                const element = ListaBiomTemp[index];
                var Biometria = {
                    NRMAR: element.NRMAR,
                    NREVN: element.NREVN,
                    CDSPC: element.CDSPC,
                    TMMED: element.TMMED,
                    CNSPC: element.CNSPC
                };
                biom_list.push(Biometria);
            }
            return biom_list;
        },

        eliminarDatosBiometria: function(){
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

        guardarDatosIncidental: function(){
            var IncidenReg = [];//modelo de lista de pesca incidental
            var pscinc_list = [];
            for (let index = 0; index < IncidenReg.length; index++) {
                const element = IncidenReg[index];
                var incidental = {
                    CDSPC: element.CDSPC,
                    DSSPC: element.DSSPC,
                    NREVN: element.NREVN,
                    NRMAR: element.NRMAR,
                    PCSPC: element.PCSPC
                };
                pscinc_list.push(incidental);
            }
            return pscinc_list;
        },

        obtenerPescaBodega: function(){
            var bodegas = [];//modelo de bodegas
            var lista = [];
            for (let index = 0; index < bodegas.length; index++) {
                const element = bodegas[index];
                var listBodegas = {
                    INDTR: element.INDTR,
                    NRMAR: element.NRMAR,
                    NREVN: element.NREVN,
                    CDBOD: element.CDBOD,
                    CNPCM: element.CNPCM
                };
                lista.push(listBodegas);
            }
            return lista;
        },

        obtenerPescaDeclarada: function(){
            var pescaDeclarada = [];//modelo pesca declarada
            var lista = [];
            for (let index = 0; index < pescaDeclarada.length; index++) {
                const element = pescaDeclarada[index];
                var listPescaDeclarada = {
                    INDTR: element.INDTR,
                    NRMAR: element.NRMAR,
                    NREVN: element.NREVN,
                    CDSPC: element.CDSPC,
                    CNPCM: element.CNPCM,
                    CDUMD: element.CDUMD,
                    ZMODA: element.ZMODA,
                    OBSER: element.OBSER,                   
                };
                lista.push(listPescaDeclarada);
            }
            return lista;
        },

        obtenerPescaDescargada: function(element){
            var modelo = this.getOwnerComponent().getModel("DetalleMarea");
            var pescaDescargada = {};//modelo pesca descargada
            var ePescaDescargada = {};//modelo pesca descargada eliminada
            var lista = [];
            var EListPescaDescargada = {
                INDTR: ePescaDescargada.INDTR,
                INDEJ: ePescaDescargada.INDEJ,
                NRDES: ePescaDescargada.NRDES
            };
            lista.push(EListPescaDescargada);

            var listPescaDescargada = {
                INDTR: pescaDescargada.INDTR,
                INDEJ: pescaDescargada.INDEJ,
                NRMAR: pescaDescargada.NRMAR,
                NREVN: element.NREVN,
                NRDES: pescaDescargada.NRDES,
                TICKE: pescaDescargada.TICKET,
                CDEMB: modelo.getProperty("/DatosGenerales/CDEMB"),
                CDPTA: pescaDescargada.CDPTA,
                INPRP: element.INPRP,
                CDSPC: pescaDescargada.CDSPC,
                
            }
        }







    });

}
);