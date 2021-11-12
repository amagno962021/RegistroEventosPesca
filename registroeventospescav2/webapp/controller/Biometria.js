sap.ui.define([
	"sap/ui/base/ManagedObject"
], function(
	ManagedObject
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
            console.log("TextoNav2 : " + this._navBio)
            var i_tme =  this._oView.byId("idTallaMenor").getValue();
            var i_tma =  this._oView.byId("idTallaMayor").getValue();
            let v_rest = i_tma - i_tme;
            let v_sumMen = Number('0');
            let v_tallamAyorA = Number(i_tme) + Number((2*v_rest));
            this._oView.byId("table_biometria").destroyColumns();

            this.setColumnDinamic("Cod. Especie","","CodEspecie");
            this.setColumnDinamic("Especie","","Especie");

            var d1 = Number(i_tme);
            var d2 = Number(v_tallamAyorA);
            
            if(v_rest > 0){
                for (var i=d1; i<= v_tallamAyorA; i++){

                    if(i==d1){v_sumMen = Number(d1);}
                    else{v_sumMen = Number(v_sumMen) + Number('0.5');}

                    console.log("ddd : " + v_sumMen);
                    let idCol = "col_" + i;
                    this.setColumnDinamic(v_sumMen,idCol);
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
                        //value: textCol 
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
			var oButton = oEvent.getSource(),
				oView = this._oView;

			if (!this._pDialog) {
				this._pDialog = Fragment.load({
					id: oView.getId(),
					name: "com.tasa.registroeventospescav2.fragments.Popup_especie",
					controller: this
				}).then(function(oDialog){
					oView.addDependent(oDialog);
					return oDialog;
				});
			}

			this._pDialog.then(function(oDialog){
				this._configDialog(oButton, oDialog);
				oDialog.open();
			}.bind(this));
		},

        _configDialog: function (oButton, oDialog) {

			// Multi-select if required
			var bMultiSelect = !!oButton.data("multi");
			oDialog.setMultiSelect(bMultiSelect);

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

        obtenerEspecies: function(oEvent){
            this.lst_Biometria = [];
            self= this;
            //let oSelectedItem = this._oView.byId("myDialog").getItems(); 
            var aContexts = oEvent.getParameter("selectedContexts");
            if (aContexts && aContexts.length) {
                aContexts.map(function (oContext) 
                { 
                    self.lst_Biometria.push({
                        CodEspecie: oContext.getObject().id,
                        Especie: oContext.getObject().descripcion
                     });
                
                })
            }
            // let oSelectedItem = this._oView.byId("myDialog").getSelectedItems(); 
            // for (var i = 0; i < oSelectedItem.length; i++) {
            //     var item1 = oSelectedItem[i];
            //     var cells = item1.getCells();
            //     console.log(cells[0].getText());
            //     console.log(cells[1].getText());

            //     lst_Biometria.push({
            //         CodEspecie: cells[0].getText(),
            //         Especie: cells[1].getText()
            //     });
                    
            // }
            this._oView.getModel("eventos").setProperty("/ListaBiometria", this.lst_Biometria);
            this._oView.getModel("eventos").updateBindings(true);
        },

        deleteItemsBiometria: function(oevent){
            let tablaBio = this._oView.byId("table_biometria");
            let ListaBiometrias = this._oView.getModel("eventos").getData().ListaBiometria;
            let ListadeIndices  = tablaBio.getSelectedIndices();
            for (var i = 0; i < ListaBiometrias.length; i++) {
                for (let index = 0; index < ListadeIndices.length; index++) {
                    if(ListadeIndices[index] == i){
                        ListaBiometrias.splice(i, 1);
                    }
                    
                }
                    
            }
            /*****************************ELIMINACION DE PESCA DECLARADA************************************** */
            let ListaPescaDecl = this._oView.getModel("eventos").getData().ListaPescaDeclarada;
            for (var i = 0; i < ListaPescaDecl.length; i++) {
                for (let index = 0; index < ListadeIndices.length; index++) {
                    if(ListadeIndices[index] == i){
                        ListaPescaDecl.splice(i, 1);
                    }
                    
                }
                    
            }
            this._oView.getModel("eventos").setProperty("/ListaPescaDeclarada",ListaPescaDecl);
            this._oView.getModel("eventos").setProperty("/ListaBiometria",ListaBiometrias);
        },

        cargarDataBiometria:function(){
            if (this.ctr._listasServicioCargaIni[18] ? true : false) {
                let listaDataBio = this.ctr._listasServicioCargaIni[18].str_flbsp_matched;
            }else{
                this.getTableDefault();
            }
        }


	});
});