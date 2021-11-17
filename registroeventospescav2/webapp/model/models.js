sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
    "sap/ui/model/resource/ResourceModel"
], function (JSONModel, Device, ResourceModel) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createInitModel: function(){
			var initModel = {
				Cabecera: {
					NRMAR: "",
                    CDMMA: "",
                    OBMAR: "",
                    CDEMB: "",
                    NMEMB: "",
                    MREMB: "",
                    CDPTA: "",
                    CDEMP: "",
                    NAME1: "",
                    INPRP: "",
                    WERKS: ""
				},
                DatosGenerales: {
					CDEMB: "",
                    NMEMB: "",
                    CDEMP: "",
                    NAME1: "",
                    CDSPE: "",
                    DSSPE: "",
                    CDMMA: "",
                    CDPTA: "",
                    INUBC: "",
                    ESMAR: "",
                    FEARR: "",
                    FIMAR: "",
                    FFMAR: "",
                    WERKS: "",
                    NuevoArmador: {
                        RUC: "",
                        RAZON: "",
                        CALLE: "",
                        DISTRITO: "",
                        PROVINCIA: "",
                        DEPARTAMENTO: ""
                    }
				},
                Eventos: {
					TituloEventos: "",
                    Lista: [],
                    CurrentEvento: {}
				},
                ResCombustible: {},
                VentaCombustible: {},
                DistribFlota: {
                    CDPTA: "",
                    DESCR: "",
                    CDPTO: "",
                    DSPTO: "",
                    LTGEO: "",
                    LNGEO: "",
                    FEARR: "",
                    HEARR: "",
                    EMPLA: "",
                    WKSPT: "",
                    CDUPT: "",
                    DSEMP: "",
                    INPRP: "",
                },
                MareaAnterior:{
                    NRMAR: "",
                    ESMAR: "",
                    CDMMA: "",
                    FEMAR: "",
                    HAMAR: "",
                    FXMAR: "",
                    HXMAR: "",
                    FIMAR: "",
                    HIMAR: "",
                    FFMAR: "",
                    HFMAR: "",
                    ESCMA: "",
                    EventoMarAnt: {
                        NREVN: "",
                        CDTEV: "",
                        FIEVN: "",
                        HIEVN: "",
                        FFEVN: "",
                        HFEVN: ""
                    }
                },
                EsperaMareaAnt: {

                },
                Eventos: {

                },
                Config: {
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
                    visibleTabReserva: true,
                    visibleTabVenta: true,
                    readOnlyFechIni: true,
					datosCombo: {
                        Departamentos: [],
                        MotivosMarea: [],
                        UbicPesca: [],
                        EstMar: [],
                        TipoEventos: [],
                        Plantas: []
                    }
				},
                FormNewMarea: {
                    Planta: "",
                    Embarcacion: "",
                    EmbarcacionDesc: ""
                }
			};
			var oModel = new JSONModel(initModel);
			//oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

        createFiltroModel: function(){
            var data = {
                DescUbicacion: "",
                IndPropiedad: "",
                Planta: "",
                TipoEmbarcacion: "",
                ValFijoPlanta: ""
            };
            var oModel = new JSONModel(data);
			return oModel;
        },

        createCombosModel: function(){
            var data = {
                Plantas: [],
                Embarcaciones: [],
                IndPropiedad: [],
                TituloEmba: "",
                NumerosPaginacion: [],
            };
            var oModel = new JSONModel(data);
			return oModel;
        },

        createDataSession: function(){
            var data = {
                User: "FGARCIA",
                IsAllOk: false,
                IsRollngComb: false,
                IsRolRadOpe: false,
                MareaReabierta: false,
                RolFlota: "",
                SoloLectura: false,
                Type: ""
            };
            var oModel = new JSONModel(data);
			return oModel;
        },

        createVisibleModel: function(){
            var data = {
                EnlMarAnterior: false
            };
            var oModel = new JSONModel(data);
			return oModel;
        },

        createResourceModel: function(){
            var config = {
                bundleName: "com.tasa.registroeventospescav2.i18n.i18n"
            };
            var oModel = new ResourceModel(config);
            return oModel;
        },

        createUtilsModel: function(){
            var data = {
                VedaVerificada: true
            };
            var oModel = new JSONModel(data);
			return oModel;
        },

        createFormModel: function(){
            var data = {
                MotMarea: "",
                Embarcacion: "",
                DescEmbarcacion: "",
                MatrEmbarcacion: "",
                SistPesca: "",
                Armador: "",
                DescArmador: "",
                PermisoSur: "",
                FechaPermisoSur: "",
                CapBodegaPermiso: 0,
                CenEmbarcacion: ""
            };
            var oModel = new JSONModel(data);
			return oModel;
        },

        createMareaAnteriorModel: function(){
            var data = {
                Marea: 0,
                MotMarea: "",
                DescMotivoMarea: "",
                EstCierre: "",
                EstMarea: "",
                FecApertura: "",
                FecCierre: "",
                FecFin: "",
                FecInicio: "",
                HorAperttura: "",
                HorCierre: "",
                HorFin: "",
                HorInicio: "",
                EventosMarAnt: {
                    DescTipoEvento: "",
                    Empresa: "",
                    Estado: "",
                    FechFIn: "",
                    FechIni: "",
                    HoraFin: "",
                    HoraIni: "",
                    Numero: 0,
                    Planta: "",
                    Puerto: "",
                    TipoEvento: ""
                }
            };
            var oModel = new JSONModel(data);
			return oModel;
        },

        createUttilitarioModel: function(){
            var data = {
                motivoSinZarpe: ["3", "7", "8"]
            };
            var oModel = new JSONModel(data);
			return oModel;
        },

        createConstantsUtility: function(){
            var data = {
                CARACTERNUEVO: "N",
                CARACTEREDITAR: "E",
                CARACTERBORRAR: "D"
            };
            var oModel = new JSONModel(data);
			return oModel;
        },

        createDistribFlotaModel: function(){
            var data = {
                CentPlanta: "",
                DescEmpresa: "",
                DescPlanta: "",
                DescPuerto: "",
                Editado: false,
                Empresa: "",
                FecArribo: "",
                HorArribo: "",
                Indicador: "",
                IndPropPlanta: "",
                IntLatPuerto: "",
                IntLonPuerto: "",
                LatPuerto: "",
                LonPuerto: "",
                Planta: "",
                Puerto: "",
                UbicPlanta: ""
            };
            var oModel = new JSONModel(data);
			return oModel;
        },

        createConstantesModel: function(){
            var data = {
                CodUbicSur: "",
                PorcCalRangComb: "",
                ValMaxFlujPanga: ""
            };
            var oModel = new JSONModel(data);
			return oModel;
        }


	};
});