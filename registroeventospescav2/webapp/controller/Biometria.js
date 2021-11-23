sap.ui.define([
	'sap/ui/model/FilterOperator',
    'sap/ui/model/Filter',
    "sap/ui/core/syncStyleClass",
    'sap/ui/core/Fragment',
	"sap/ui/base/ManagedObject",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
	"sap/ui/integration/library",
    "sap/m/MessageBox"
], function(
	FilterOperator,
    Filter,
    syncStyleClass,
    Fragment,
	ManagedObject,
    JSONModel,
    MessageToast,
    integrationLibrary,
    MessageBox
) {
	"use strict";

	return ManagedObject.extend("com.tasa.registroeventospescav2.controller.Biometria", {

        constructor: function(oView,sFragName,idBiometria, oThis) {

            this._oView = oView;
            this._oControl = sap.ui.xmlfragment(oView.getId(), "com.tasa.registroeventospescav2.fragments."+ sFragName,this);
            this._bInit = false;
            this.ctr = oThis;
            this._navBio = idBiometria;
            this.cargarDataBiometria();
            console.log("TextoNav : " + idBiometria)

        },

        onButtonPress3:function(o_event){
            console.log(o_event);
            console.log("TextoNav2 : " + this._navBio);
            var i_tme =  this._oView.byId("idTallaMenor").getValue();
            var i_tma =  this._oView.byId("idTallaMayor").getValue();
            let v_rest = i_tma - i_tme;
            let v_sumMen = Number('0');
            let v_tallamAyorA = Number(i_tme) + Number((2*v_rest));
            let v_tallamAyorB = Number(i_tme) + Number(v_rest);
            this._oView.byId("table_biometria").destroyColumns();

            this.setColumnDinamic("Cod. Especie","","CodEspecie");
            this.setColumnDinamic("Especie","","Especie");

            if(this.ctr._motivoMarea == "2"){
                var d1 = Number(i_tme);
                if(v_rest > 0){
                    for (var i=d1; i<= v_tallamAyorA; i++){
    
                        if(i==d1){v_sumMen = Number(d1);}
                        else{v_sumMen = Number(v_sumMen) + Number('0.5');}
    
                        console.log("ddd : " + v_sumMen);
                        let idCol = "col_" + i;
                        this.setColumnDinamic(v_sumMen,idCol,idCol);
                    }
                }

            }else if(this.ctr._motivoMarea == "1"){
                var d1 = Number(i_tme);
                if(v_rest > 0){
                    for (var i=d1; i<= v_tallamAyorB; i++){
    
                        if(i==d1){v_sumMen = Number(d1);}
                        else{v_sumMen = Number(v_sumMen) + Number('1');}
    
                        console.log("ddd : " + v_sumMen);
                        let idCol = "col_" + i;
                        this.setColumnDinamic(v_sumMen,idCol,idCol);
                    }
                }

            }

            this.setColumnDinamic("Moda","","Moda");
            this.setColumnDinamic("Muestra","","Muestra");
            this.setColumnDinamic("Porc. Juveniles","","PorcJuveniles");

            //this._oView.getModel("eventos").updateBindings(true);

        },

        getTableDefault:function(){

            this.setColumnDinamic("Cod. Especie","","CodEspecie");
            this.setColumnDinamic("Especie","","Especie");
            this.setColumnDinamic("Moda","","Moda");
            this.setColumnDinamic("Muestra","","Muestra");
            this.setColumnDinamic("Porc. Juveniles","","PorcJuveniles");

        },

        setColumnDinamic:function(textCol,idCol,paramModel){
            let CampoSet = "{eventos>" + paramModel + "}";
            if(idCol != ""){
                this._oView.byId("table_biometria").addColumn( new sap.ui.table.Column(idCol,{
                    label: new sap.m.Label({
                        text: textCol 
                    }),
                    template : new sap.m.Input({
                        value: CampoSet 
                       // enabled : textCol
                       // enabled : textCol ===  "CodEspecie"? false: true
                    })
                }));
            }
            else{
                this._oView.byId("table_biometria").addColumn( new sap.ui.table.Column({
                    label: new sap.m.Label({
                        text: textCol 
                    }),
                    template : new sap.m.Text({
                        text: CampoSet 
                    }),
                    width : '10rem'
                }));
            }
        },

        getcontrol:function(){
            return this._oControl;
        },

        handleTableSelectDialogPress: function (oEvent) {

            let me = this;
            me.getDialog_add_especie().open();
            if (this.ctr._motivoMarea == "1") {
                this._oView.byId("fe_popup_cantPesca").setVisible(true);
            
                        
            } else {
                this._oView.byId("fe_popup_cantPesca").setVisible(false);
            }
            
		},
        getDialog_add_especie: function () {
            if (!this.oDialog_I) {
                this.oDialog_I = sap.ui.xmlfragment("com.tasa.registroeventospescav2.fragments.Popup_especie", this);
                this._oView.addDependent(this.oDialog_I);
            }
            return this.oDialog_I;
        },
        cerrarPopup_esp :function(){
            this.getDialog_add_especie().close();
        },

        _configDialog: function (oButton, oDialog) {

			// Multi-select if required
			// var bMultiSelect = !!oButton.data("multi");
			// oDialog.setMultiSelect(bMultiSelect);

			// toggle compact style
			syncStyleClass("sapUiSizeCompact", this._oView, oDialog);
		},

        handleSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("descripcion", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
            console.log(oBinding);
            oBinding.filter([oFilter]);
            if(oBinding.aLastContextData.length == 0){
                var oFilter2 = new Filter("id", FilterOperator.Contains, sValue);
                oBinding.filter([oFilter2]);
            }
		},

        obtenerEspecies: function(){
            let nodoPescaDeclarada = this._oView.getModel("eventos").getData().ListaPescaDeclarada;
			let motivoMarea = this.ctr._motivoMarea;
			let especie = sap.ui.getCore().byId("cb_especies_espec").getSelectedKey();
			let cantPesca = sap.ui.getCore().byId("ip_especies_cp").getValue();
			let especiePermitida = this.ctr._listaEventos[this.ctr._elementAct].EspePermitida;
            let bOk = true;
            let Pesca= {};
            
            if(especie == ""){
                let mensaje = this.ctr.oBundle.getText("MISSINGFIELD", "Especie");
                MessageBox.error(mensaje);
            }else{
                for (let i = 0; i < nodoPescaDeclarada.length; i++) {			
                    if (nodoPescaDeclarada[i].CDSPC == especie ) {
                        bOk = false;
                        let mensaje = this.ctr.oBundle.getText("EXISTEESPDECLARADA");
                        MessageBox.error(mensaje);
                        break;
                    }
                                             
                }
            }
			
			
			if (bOk) {
				if (this._containsKey(especiePermitida,especie)) {
					let permisoEspecies = this.ctr._FormMarea.EspPermitida; //falta cargar data consultarPermisoPesca
					let especieZonaPesca = this.ctr._listaEventos[this.ctr._elementAct].EspeZonaPesca;
					let especieVeda = this.ctr._listaEventos[this.ctr._elementAct].EspeVeda;
					let obsvEspecie = "";
					let espOk = true;
								
					if (permisoEspecies == null || (permisoEspecies != null && this._containsKey(permisoEspecies,especie))) {
						espOk = false;
						obsvEspecie += this.ctr.oBundle.getText("EMBNOPERMISOESP") + " ";
					}
					
					if (especieZonaPesca == null || (especieZonaPesca != null && this._containsKey(especieZonaPesca,especie))) {
						espOk = false;
						obsvEspecie += this.ctr.oBundle.getText("ESPNOPERMITZONA") + " ";
					}
					
					if (especieVeda != null && this._containsKey(especieVeda,especie)) {
						espOk = false;
						obsvEspecie += this.ctr.oBundle.getText("ESPECIEENVEDA") + " ";
					}
				
					if (!espOk) {
						this.ctr._listaEventos[this.ctr._elementAct].ObseAdicional = this.ctr.oBundle.getText("OBSADICCALAESPNOVALIDA");
						this.ctr.modeloVisible.VisibleObservAdicional = true;
					}
				
					Pesca.Observacion =obsvEspecie;
				}

				this.ctr._listaEventos[this.ctr._elementAct].ListaPescaDeclarada.push({
                    CDSPC: especie,
                    DSSPC: sap.ui.getCore().byId("cb_especies_espec").getSelectedItem().getText(),
                    PorcPesca: "",
                    CNPCM: "",
                    DSUMD: this.ctr._ConfiguracionEvento.CalaDescUMPescaDecl,
                    UnidMedida: this.ctr._ConfiguracionEvento.CalaUMPescaDecl,
                    ZMODA: "",
                    OBSER: Pesca.Observacion,
                    Indicador:"N"
                 });
                 

                 this.ctr._listaEventos[this.ctr._elementAct].ListaBiometria.push({
                    CodEspecie: especie,
                    Especie: sap.ui.getCore().byId("cb_especies_espec").getSelectedItem().getText()
                 });

                 this._oView.getModel("eventos").updateBindings(true);
                
			}



            // this.lst_Biometria = [];
            // self= this;
            // //let oSelectedItem = this._oView.byId("myDialog").getItems(); 
            // var aContexts = oEvent.getParameter("selectedContexts");
            // if (aContexts && aContexts.length) {
            //     aContexts.map(function (oContext) 
            //     { 
            //         self.lst_Biometria.push({
            //             CodEspecie: oContext.getObject().id,
            //             Especie: oContext.getObject().descripcion
            //          });
                
            //     })
            // }
            // this._oView.getModel("eventos").setProperty("/ListaBiometria", this.lst_Biometria);
            // this._oView.getModel("eventos").updateBindings(true);

            this.getDialog_add_especie().close();
        },
        _containsKey :function(Lista_Busq,cod_especie){
            let especieEncontrada = false;
            for (let index = 0; index < Lista_Busq.length; index++) {
                if(especiePermitida[index].CodEspecie == cod_especie){
                    especieEncontrada = true;
                }
            }

            return especieEncontrada;

        },

        deleteItemsBiometria: function(oevent){
            let tablaBio = this._oView.byId("table_biometria");
            let ListaBiometrias = this._oView.getModel("eventos").getData().ListaBiometria;
            let ListadeIndices  = tablaBio.getSelectedIndices();
            for (var i = ListaBiometrias.length - 1; i >= 0; i--) {
                for(let index = 0; index < ListadeIndices.length; index++){
                    if(ListadeIndices[index] == i){
                        ListaBiometrias.splice(i, 1);
                    }
                }
                 
            }
            /*****************************ELIMINACION DE PESCA DECLARADA************************************** */
            let ListaPescaDecl = this._oView.getModel("eventos").getData().ListaPescaDeclarada;
            for (var i = ListaPescaDecl.length - 1; i >= 0; i--) {
                for (let index = 0; index < ListadeIndices.length; index++) {
                    if(ListadeIndices[index] == i){
                        ListaPescaDecl.splice(i, 1);
                    }
                    
                }
                    
            }
            this._oView.getModel("eventos").setProperty("/ListaPescaDeclarada",ListaPescaDecl);
            this._oView.getModel("eventos").setProperty("/ListaBiometria",ListaBiometrias);
        },

        cargarDataBiometria: async function(){
            if (this.ctr._listasServicioCargaIni[18] ? true : false) {
                let listaDataBio = this.ctr._listasServicioCargaIni[18].str_flbsp_matched;
                if(listaDataBio.length != 0){
                    let tmn = Number(0);
                    let tmy = Number(0);;
                    let key_bio = Object.keys(listaDataBio[0]);
                    let contIni = 0;
                    //--------------- obtner la talla mayor y menor para armar la tabla dinamica
                    for (let i = 0; i < key_bio.length; i++) {
                        if(key_bio[i].slice(0,5) == "TNMED"){
                            contIni++;
                            let medida = key_bio[i].split("_");
                            let key_mn = Number(medida[1]);
                            if(contIni == 1){
                                tmn = key_mn;
                                tmy = key_mn;
                            }else if(tmn > key_mn){
                                tmn = key_mn;
                            }else if(key_mn > tmy){
                                tmy = key_mn;
                            }
                            console.log(key_bio[i]);
                        }
                    }
                    this._oView.byId("idTallaMenor").setValue(tmn);
                    this._oView.byId("idTallaMayor").setValue(tmy);
                    await this.onButtonPress3();
                    //------------------ cargar data dinamica -------------------------------------//

                    for (let i = 0; i < listaDataBio.length; i++) {
                        let obj_bio = {};
                        let item_bio_key = Object.keys(listaDataBio[i]);
                        let item_bio_value = Object.values(listaDataBio[i]);
                        obj_bio['CodEspecie'] = listaDataBio[i].CDSPC;
                        obj_bio['Especie'] = listaDataBio[i].DESC_CDSPC;
                        obj_bio['Moda'] = listaDataBio[i].MODA;
                        obj_bio['Muestra'] = listaDataBio[i].CDSPC_TOTAL;
                        // obj_bio['PorcJuveniles'] = listaDataBio[i];
                        
                        if(this.ctr._motivoMarea == "2"){
                            for (let k = tmn; k <= tmy; k++) {
                                let v_talla_bio = Number(0);
                                if(k == tmn){
                                    v_talla_bio = tmn;
                                }else{
                                    v_talla_bio = Number(v_talla_bio) + Number('0.5')
                                }
                                let v_talla_bio_s = "" + v_talla_bio;
                                let val_dec = v_talla_bio_s.indexOf(".5");
                                if(val_dec == "-1"){
                                    let contBio = 0;
                                    for (let j = 0; j < item_bio_key.length; j++) {
                                        contBio++;
                                        let v2 = "TNMED" + "_" + v_talla_bio + "_" + "00";
                                        if(item_bio_key[j] == v2 ){
                                            let v3 = Number(contBio) - Number(1);
                                            obj_bio['col_' + k] = item_bio_value[v3];
                                            break;
                                        }
                                    }

                                }else{
                                    let contBio = 0;
                                    for (let j = 0; j < item_bio_key.length; j++) {
                                        contBio++;
                                        let v1 = v_talla_bio_s.split(".");
                                        let v2 = "TNMED" + "_" + v1[0] + "_" + "50";
                                        if(item_bio_key[j] == v2 ){
                                            let v3 = Number(contBio) - Number(1);
                                            obj_bio['col_' + k] = item_bio_value[v3];
                                            break;
                                        }
                                    }
                                }
                            }
                            
                        }else if(this.ctr._motivoMarea == "1"){
                            
                            for (let k = tmn; k <= tmy; k++) {
                                let contBio = 0;
                                let v2 = "TNMED" + "_" + k + "_" + "00";
                                for (let j = 0; j < item_bio_key.length; j++) {
                                    contBio++;
                                    if(item_bio_key[j] == v2 ){
                                        let v3 = Number(contBio) - Number(1);
                                        obj_bio['col_' + k] = item_bio_value[v3];
                                        break;
                                    }
                                }
                            }

                        }
                        
                        this.ctr._listaEventos[this.ctr._elementAct].ListaBiometria.push(obj_bio);

                    }
                    

                }else{
                    this.getTableDefault();
                }
            }else{
                this.getTableDefault();
            }
        },
        abrirPopup_inc :function(){
            let me = this;
            me.getDialog_add_Incidental().open();
        },
        getDialog_add_Incidental: function () {
            if (!this.oDialog_I) {
                this.oDialog_I = sap.ui.xmlfragment("com.tasa.registroeventospescav2.fragments.Popup_Incidental", this);
                this._oView.addDependent(this.oDialog_I);
            }
            return this.oDialog_I;
        },
        cerrarPopup_inc :function(){
            this.getDialog_add_Incidental().close();
        },
        agregarPopup_Inc : function(){

            this.ctr._listaEventos[this.ctr._elementAct].ListaIncidental.push({
                CDSPC: sap.ui.getCore().byId("cb_incidental_espec").getSelectedKey(),
                DSSPC: sap.ui.getCore().byId("cb_incidental_espec").getSelectedItem().getText(),
                PCSPC: sap.ui.getCore().byId("ip_incidental_porc").getValue()
             });
             
             this._oView.getModel("eventos").updateBindings(true);
             this.getDialog_add_Incidental().close();
        },
        deleteIncidentalItems : function(oevent){
            let tablaBio = this._oView.byId("table_Incidental");
            let ListaIncid = this._oView.getModel("eventos").getData().ListaIncidental;
            let ListadeIndicesInc  = tablaBio.getSelectedIndices();
            for (var i = ListaIncid.length - 1; i >= 0; i--) {
                for(let index = 0; index < ListadeIndicesInc.length; index++){
                    if(ListadeIndicesInc[index] == i){
                        ListaIncid.splice(i, 1);
                    }
                }
                 
            }
            this._oView.getModel("eventos").setProperty("/ListaIncidental",ListaIncid);
        }


	});
});