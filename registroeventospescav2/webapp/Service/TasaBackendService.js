sap.ui.define([
    "./CoreService",
    "./UtilService"
], function(
    CoreService,
    UtilService
) {
	"use strict";

    var TasaBackend = CoreService.extend("com.tasa.registroeventospescav2.Service.TasaBackendService", {

        obtenerTipoEmbarcacion: function(sUsuario){
            var uri = UtilService.getHostService() + "/api/embarcacion/listaTipoEmbarcacion";
            var arg = {
				usuario: sUsuario
			};
            return this.http(uri).get(null, arg).then(function(response){
                var data = JSON.parse(response);
                var sData = JSON.parse(data);
                return sData;
            });
        },

        obtenerPlantas: function(sUsuario){
            var uri = UtilService.getHostService() + "/api/embarcacion/listaPlantas";
            var arg = {
				usuario: sUsuario
			};
            return this.http(uri).get(null, arg).then(function(response){
                var data = JSON.parse(response);
                var sData = JSON.parse(data);
                return sData;
            });
        },

        cargarListaMareas: function(sUsuario){
            var uri = UtilService.getHostService() + "/api/embarcacion/ObtenerFlota";
            var arg = {
				usuario: sUsuario
			};
            var me = this;
            return this.http(uri).get(null, arg).then(function(response){
                var data = JSON.parse(response);
                var sData = JSON.parse(data);
                var str_di = sData.str_di;
                var uri1 = UtilService.getHostService() + "/api/dominios/Listar";
                var sBody = UtilService.getBodyDominio();
                sBody.dominios[0].domname = "ZDO_ZCDMMA";
                return me.http(uri1).post(null, sBody).then(function(sResponse){
                    var sData1 = JSON.parse(sResponse);
                    var sData2 = sData1.data[0].data;
                    console.log("Dominios: ", sData1);
                    for (let index = 0; index < str_di.length; index++) {
                        const element = str_di[index];
                        var descMotMar = "";

                        //validar descripcion motivo marea
                        for (let index1 = 0; index1 < sData2.length; index1++) {
                            const element1 = sData2[index1];
                            if (element1.id == element.CDMMA) {
                                descMotMar = element1.descripcion;
                                break;
                            }
                        }
                        
                        element.DESCMOTMAR = descMotMar;
                    }
                    return sData;
                });
            });
        },

        obtenerDetalleMarea: function(marea, sUsuario){
            var uri = UtilService.getHostService() + "/api/embarcacion/consultaMarea/";
            var sBody = UtilService.getBodyDetalleMarea();
            sBody.p_marea = marea;
            sBody.user = sUsuario;
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },

        obtenerDominio: function(dominio){
            var uri = UtilService.getHostService() + "/api/dominios/Listar";
            var sBody = UtilService.getBodyDominio();
            sBody.dominios[0].domname = dominio;
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },

        obtenerDepartamentos: function(sUsuario){
            var uri = UtilService.getHostService() + "/api/General/Read_Table/";
            var sBody = UtilService.getBodyReadTable();
            sBody.delimitador = "|";
            sBody.fields.push("BLAND");
            sBody.fields.push("BEZEI");
            sBody.option[0].wa = "SPRAS EQ 'ES' AND LAND1 EQ 'PE'";
            sBody.p_user = sUsuario;
            sBody.tabla = "T005U";
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },

        validarBodegaCert: function(embarcacion, planta){
            var uri = UtilService.getHostService() + "/api/embarcacion/ValidarBodegaCert/";
            var sBody = UtilService.getBodyValidaCert();
            sBody.codEmba = embarcacion;
            sBody.codPlanta = planta;
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },

        validarMareaProd: function(embarcacion, planta){
            var uri = UtilService.getHostService() + "/api/embarcacion/ValidarMarea/";
            var sBody = UtilService.getValidaMarea();
            sBody.p_codemb = embarcacion;
            sBody.p_codpta = planta;
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },

        obtenerDatosDstrFlota: function(embarcacion, sUsuario){
            var me = this;
            var uri = UtilService.getHostService() + "/api/General/Read_Table/";
            var sBody = UtilService.getBodyReadTable();
            sBody.delimitador = "|";
            sBody.fields = ["CDPTA", "DESCR", "CDPTO", "DSPTO", "LTGEO", "LNGEO", "FEARR", "HEARR", "EMPLA", "WKSPT", "CDUPT", "MANDT"];;
            sBody.option[0].wa = "CDEMB LIKE '" + embarcacion + "'";
            sBody.p_user = sUsuario;
            sBody.tabla = "ZV_FLDF";
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                var empla = data.data[0].EMPLA;
                var sUri = UtilService.getHostService() + "/api/General/Read_Table/";
                sBody.fields = ["DSEMP", "INPRP", "MANDT"];
                sBody.option[0].wa = "CDEMP LIKE '" + empla + "'";
                sBody.tabla = "ZV_FLMP";
                return me.http(sUri).post(null, sBody).then(function(sResponse){
                    var sData = JSON.parse(sResponse);
                    var objReturn = {
                        CDPTA: data.data[0].CDPTA,
                        DESCR: data.data[0].DESCR,
                        CDPTO: data.data[0].CDPTO,
                        DSPTO: data.data[0].DSPTO,
                        LTGEO: data.data[0].LTGEO,
                        LNGEO: data.data[0].LNGEO,
                        FEARR: data.data[0].FEARR,
                        HEARR: data.data[0].HEARR,
                        EMPLA: data.data[0].EMPLA,
                        WKSPT: data.data[0].WKSPT,
                        CDUPT: data.data[0].CDUPT,
                        DSEMP: sData.data[0].DSEMP,
                        INPRP: sData.data[0].INPRP,
                    }
                    return objReturn;
                });
            });
        },

        obtenerMareaAnterior: function(marea, embarcacion, sUsuario){
            var me = this;
            var uri = UtilService.getHostService() + "/api/General/Read_Table/";
            var sBody = UtilService.getBodyReadTable();
            sBody.delimitador = "|";
            sBody.fields = ["NRMAR", "ESMAR", "CDMMA", "FEMAR", "HAMAR", "FXMAR", "HXMAR", "FIMAR", "HIMAR", "FFMAR", "HFMAR", "ESCMA", "MANDT"];
            sBody.option[0].wa = marea ? "NRMAR < " + marea + " AND CDEMB LIKE '" + embarcacion + "'" : "CDEMB LIKE '" + embarcacion + "'"  ;
            sBody.order = "NRMAR DESCENDING";
            sBody.tabla = "ZFLMAR";
            sBody.p_user = sUsuario;
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerNroReserva: function(nrmar, sUsuario){
            var uri = UtilService.getHostService() + "/api/General/Read_Table/";
            var sBody = UtilService.getBodyReadTable();
            sBody.delimitador = "|";
            sBody.fields = ["NRRSV"];
            sBody.option[0].wa = "NRMAR = " + nrmar + " AND ESRSV EQ 'S'";
            sBody.tabla = "ZFLRSC";
            sBody.p_user = sUsuario;
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerCodigoTipoPreservacion: function(cdemb, user){
            var uri = UtilService.getHostService() + "/api/General/ConsultaGeneral/";
            var sBody = UtilService.getConsultaGeneral();
            sBody.nombreConsulta = "CONSGENCODTIPRE";
            sBody.parametro1 = cdemb;
            sBody.p_user = user;
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerListaEquipamiento: function(cdemb, user){
            var uri = UtilService.getHostService() + "/api/General/ConsultaGeneral/";
            var sBody = UtilService.getConsultaGeneral();
            sBody.nombreConsulta = "CONSGENLISTEQUIP";
            sBody.parametro1 = cdemb;
            sBody.p_user = user;
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerListaCoordZonaPesca: function(zonaPesca, user){
            var uri = UtilService.getHostService() + "/api/General/ConsultaGeneral/";
            var sBody = UtilService.getConsultaGeneral();
            sBody.nombreConsulta = "CONSGENCOOZONPES";
            sBody.parametro1 = zonaPesca;
            sBody.p_user = user;
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerListaPescaDeclarada: function(nroMarea, nroEvento, user){
            var uri = UtilService.getHostService() + "/api/General/ConsultaGeneral/";
            var sBody = UtilService.getConsultaGeneral();
            sBody.nombreConsulta = "CONSGENPESDECLA";
            sBody.parametro1 = nroMarea;
            sBody.parametro2 = nroEvento;
            sBody.p_user = user;
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerListaBodegas: function(cdemb, user){
            var uri = UtilService.getHostService() + "/api/General/ConsultaGeneral/";
            var sBody = UtilService.getConsultaGeneral();
            sBody.nombreConsulta = "CONSGENLISTBODE";
            sBody.parametro1 = cdemb;
            sBody.p_user = user;
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });    
        },

        obtenerListaPescaBodegas: function(cdmarea, nroEvento, user){
            var uri = UtilService.getHostService() + "/api/General/ConsultaGeneral/";
            var sBody = UtilService.getConsultaGeneral();
            sBody.nombreConsulta = "CONSGENPESBODE";
            sBody.parametro1 = cdmarea;
            sBody.parametro2 = nroEvento;
            sBody.p_user = user;
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerListaPuntosDescarga: function(codPlanta, user){
            var uri = UtilService.getHostService() + "/api/General/ConsultaGeneral/";
            var sBody = UtilService.getConsultaGeneral();
            sBody.nombreConsulta = "CONSGENPUNTDES";
            sBody.parametro1 = codPlanta;
            sBody.p_user = user;
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerListaPescaDescargada: function(nroDescarga, user){
            var uri = UtilService.getHostService() + "/api/General/ConsultaGeneral/";
            var sBody = UtilService.getConsultaGeneral();
            sBody.nombreConsulta = "CONSGENPESDESC";
            sBody.parametro1 = nroDescarga;
            sBody.p_user = user;
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerListaSiniestros: function(cdmarea, nroEvento){
            var uri = UtilService.getHostService() + "/api/General/Read_Table/";
            var sBody = UtilService.getBodyReadTable();
            sBody.delimitador = "|";
            sBody.fields = ["CDINC", "TTINC", "CDSIS", "EQKTX", "AUSWK", "ESOPA", "ESOPP"];
            sBody.option[0].wa = "NRMAR = " + cdmarea + " AND NREVN = " + nroEvento + " AND SPRAS EQ 'S'";
            sBody.tabla = "ZV_FLSI";
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });


        },
        obtenerListaHorometro: function(centro, evento, marea, nroEvento){
            var uri = UtilService.getHostService() + "/api/eventospesca/obtenerHoroEvento/";
            var sBody = UtilService.getHorometro();
            sBody.centro = centro;
            sBody.evento = evento;
            sBody.marea = marea;
            sBody.nroEvento = nroEvento;
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },

        obtenerConfiguracionEvento: function(){
            var uri = UtilService.getHostService() + "/api/eventospesca/ObtenerConfEventosPesca/";
            var sBody = {};
            return this.http(uri).post(null).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },

        obtenerListaDescargaPopUp: function(matricula, nom_embarcacion, cod_planta, nom_planta, fecha_inicio, user){
            var uri = UtilService.getHostService() + "/api/General/ConsultaGeneral/";
            var sBody = UtilService.getConsultaGeneral();
            sBody.nombreConsulta = "CONSGENLISTDESCPP";
            sBody.parametro1 = matricula;
            sBody.parametro2 = nom_embarcacion;
            sBody.parametro3 = cod_planta;
            sBody.parametro4 = nom_planta;
            sBody.parametro5 = fecha_inicio;
            sBody.p_user = user;
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerListaDescargaCHDPopUp: function(p_options){
            var uri = UtilService.getHostService() + "/api/General/Read_Table/";
            var sBody = UtilService.getBodyReadTable();
            sBody.delimitador = "|";
            sBody.fields = ["NRO_ASIGNACION", "CDEMB", "NMEMB", "MREMB", "CDPTA", "DSPTA", "WERKS", "CANT_RECIBIDA", "ESPECIE", 
            "FEPROD", "FECLLEGA", "HORLLEGA", "FECINIBOD", "HORINIBOD", "MANDT"];
            sBody.option = [];
            sBody.options = p_options
            sBody.tabla = "ZV_FLAE";
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });


        },

        eliminarPescaDescargada: function(marea, numero, user){
            var uri = UtilService.getHostService() + "/api/calendariotemporadapesca/Eliminar";
            var sBody = UtilService.getElimPescaDesc();
            sBody.p_user = user;
            sBody.i_table = "ZFLEVN";
            sBody.t_data = "|" + marea + "|" + numero;
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },

        actualizarPescaDescargada: function(marea, numero, user){
            let array = [];
            array.push({
                cmopt: "NRMAR = " + marea + " AND NREVN = " + numero,
                cmset:"NRDES = '' FIEVN = '' HIEVN = '' FFEVN = '' HFEVN = ''",
                nmtab:"ZFLEVN"
            });
            var uri = UtilService.getHostService() + "/api/General/Update_Camp_Table/";
            var sBody = UtilService.getActuaPescaDesc();
            sBody.str_set = array;
            sBody.p_user = user;
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },
        anularDescargaRFC: function(NroDescarga){
            var uri = UtilService.getHostService() + "/api/eventospesca/AnularDescarga/";
            var sBody = UtilService.getAnularDescRFC();
            sBody.p_nrdes = NroDescarga;
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },
        verificarTemporada: function(codTemp, fecha){
            var uri = UtilService.getHostService() + "/api/General/Read_Table/";
            var sBody = UtilService.getBodyReadTable();
            sBody.delimitador = "|";
            sBody.fields = ["CDTPC"];
            sBody.option[0].wa = "CDTPC = '" + codTemp + "' AND FHCAL LIKE '" + fecha + "'";
            sBody.tabla = "ZFLCLT";
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerTemporadas: function(codTemp, fecha){
            var uri = UtilService.getHostService() + "/api/General/Read_Table/";
            var sBody = UtilService.getBodyReadTable();
            sBody.delimitador = "|";
            sBody.fields = ["CDSPC", "DSSPC", "LTINI", "LNINI", "LTFIN", "LGFIN", "MILLA", "MANDT"];
            sBody.option[0].wa = "CDTPC = '" + codTemp + "' AND FHCAL LIKE '" + fecha + "'";
            sBody.tabla = "ZV_FLCP";
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerEspeciesPermitidas: function(cdemb, codTemp){
            var uri = UtilService.getHostService() + "/api/General/Read_Table/";
            var sBody = UtilService.getBodyReadTable();
            sBody.delimitador = "|";
            sBody.fields = ["CDSPC"];
            sBody.option[0].wa = "CDEMB = '" + cdemb + "' AND CDTPC LIKE '" + codTemp + "' AND INPMS = 'I'";
            sBody.tabla = "ZFLPEC";
            return this.http(uri).post(null, sBody).then(function(response){
                return response;
            });
        },

        obtenerCapaTanBarca: function(cdemb){
            var uri = UtilService.getHostService() + "/api/General/Read_Table/";
            var sBody = UtilService.getBodyReadTable();
            sBody.delimitador = "|";
            sBody.fields = ["CDTAN"];
            sBody.option[0].wa = "CDEMB = '" + cdemb + "'";
            sBody.tabla = "ZFLEMB";
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },

        consultarHorometro: function(cdemb, nrmar){
            var uri = UtilService.getHostService() + "/api/embarcacion/consultarHorometro/";
            var sBody = UtilService.getBodyConHorom();
            sBody.ip_cdemb = cdemb;
            sBody.ip_nrmar = nrmar;
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },

        obtenerMillasLitoral: function(latiCalaD, latiCalaM){
            var uri = UtilService.getHostService() + "/api/General/Read_Table/";
            var sBody = UtilService.getBodyReadTable();
            sBody.delimitador = "|";
            sBody.fields = ["LATGR", "LATMI", "LONGR", "LONMI"];
            sBody.option[0].wa = "LATGR = '" + latiCalaD +"' AND LATMI >= '" + latiCalaM + "' AND LATMI < '" + (latiCalaM + 1) + "' ";
            sBody.order = "LATMI ASCENDING";
            sBody.tabla = "ZFLLLL";
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },

        obtenerMareaBiometria: function(embarcacion, p_marea, user){
            var uri = UtilService.getHostService() + "/api/embarcacion/consultaMarea2/";
            var sBody = UtilService.getConsultaMareaBio();
            sBody.p_embarcacion = embarcacion;
            sBody.p_marea = p_marea;
            sBody.user = user;
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        },

        test: function(){
            var latiCalaD = "";
            var latiCalaM = "";
            var uri = UtilService.getHostService() + "/api/General/Read_Table/";
            var sBody = UtilService.getBodyReadTable();
            sBody.delimitador = "|";
            sBody.fields = ["LATGR", "LATMI", "LONGR", "LONMI"];
            sBody.option[0].wa = "LATGR = '" + latiCalaD +"' AND LATMI >= '" + latiCalaM + "' AND LATMI < '" + (latiCalaM + 1) + "' ";
            sBody.order = "LATMI ASCENDING";
            sBody.tabla = "ZFLLLL";
            return this.http(uri).post(null, sBody).then(function(response){
                var data = JSON.parse(response);
                return data;
            });
        }

    });

    return new TasaBackend();
});