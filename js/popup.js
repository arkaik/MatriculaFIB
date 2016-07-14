$(document).ready(function() {

  //All links inside the popup load in a new tab
  $('body').on('click', 'a', function() {
    var hyperlink = $(this).attr('href')
    if (hyperlink !== "#") {
      chrome.tabs.create({
        url: hyperlink
      });
    }
    return false;
  });
  //Number of elements
  var numberOfAssigs = 0;
  var justPressed = false;

  //Get all data and add it, if any, and update it to the latest results
  chrome.storage.local.get(null, function(items) {
    var allKeys = Object.keys(items);
    if (!jQuery.isEmptyObject(items)) {
      $.each(items, function(j, item) {
        var newRow = '<tr id="assig' + j + '">' +
                       "<td>" + (numberOfAssigs + 1) + "</td>" +
                       "<td>" + item.assigName + "</td>"+
                       "<td>" + item.grupVal + "</td>"+
                       "<td>" + item.placesLliures + "</td>"+
                       "<td>" + item.placesTotals + "</td>" +
                       "<td>" + "<button row='"+ j +"' type='button' class='btn btn-danger delBtn'> x </button>" + "</td>" +
                     "</tr>";

        $('#subjectsTable').append(newRow);
        numberOfAssigs++;
      })
      retrieveData();
      refreshTable();
    }
  });

  function buildDataJSON(html) {
    html = html.trim();
    html = html.substring(html.search("{\"data\"")).trim();
    html = html.substring(0, html.search("]}]}") + "]}]}".length).trim();
    data = JSON.parse(html);
    return data;
  }

  function updateHTML(assigName, grupVal) {
    // if (!document.getElementById('assig' + (numberOfAssigs))) {
    var newRow = '<tr id="assig' + numberOfAssigs + '">' +
                   "<td>" + (numberOfAssigs + 1) + "</td>" +
                   "<td>" + assigName + "</td>"+
                   "<td>" + grupVal + "</td>"+
                   "<td>" + undefined + "</td>"+
                   "<td>" + undefined + "</td>" +
                   "<td>" + "<button row='"+ numberOfAssigs +"' type='button' class='btn btn-danger delBtn'> x </button>" + "</td>" +
                 "</tr>";

    $('#subjectsTable').append(newRow);
    numberOfAssigs++;
  }

  var assigs = {};

  function refreshTable () {
    var save = {};
    var table = document.getElementById('subjectsTable');
    for (var p = 1; p < table.rows.length; ++p) {
      //console.log(table.rows[i].innerHTML);
      var assig = table.rows[p].cells[1].innerHTML;
      var grup = table.rows[p].cells[2].innerHTML;
      var isValid = false;
      for (var q = 0; q < assigs.length; ++q) {
        //console.log(a[q]["nomAssig"]);
        if (assigs[q]["nomAssig"] == assig) {
          grups = assigs[q]["grups"];
          for (var r = 0; r < grups.length; ++r) {
            if (grups[r]["tipusGrup"] == "N" && grups[r]["nom"] == grup) {
              isValid = true;
              placesLliures = grups[r]["placesLliures"];
              placesTotals = grups[r]["placesTotals"];
              table.rows[p].cells[3].innerHTML = placesLliures;
              table.rows[p].cells[4].innerHTML = placesTotals;
              var assigName = assig;
              var grupVal = grup;
              var contingutAssig = { assigName, grupVal, placesLliures, placesTotals };
              //console.log(contingutAssig);
              save[(p-1)] = contingutAssig;
            }
          }
        }
      }
      if(!isValid) {
        toastr.options = {
          "newestOnTop": true,
          "positionClass": "toast-bottom-center",
          "showDuration": "150",
          "hideDuration": "500",
          "timeOut": "2000"
        }
        table.deleteRow(p);
        toastr.error("L'assignatura " + assig + " o el seu grup són incorrectes o no s'ofereixen.");
      }
    }
    chrome.storage.local.set(save);
  }

  //Retrieve data from the webpage
  function retrieveData() {
    var xhr = new XMLHttpRequest();
    var url2 = "http://www.fib.upc.edu/fib/estudiar-enginyeria-informatica/matricula/lliures/lliuresGRAU.html";
    var url1 = "http://www.fib.upc.edu/fib/estudiar-enginyeria-informatica/matricula/lliures/lliuresFS.html";
    var assigs1, assigs2;
    xhr.open("GET", url1, false);
    xhr.onreadystatechange = function() {
      //console.log("mida resposta: " + xhr.responseText.length);
      assigs1 = buildDataJSON(xhr.responseText);
      //console.log(assigs1);
    };
    xhr.send();
    xhr.open("GET", url2, false);
    xhr.onreadystatechange = function() {
      //console.log("mida resposta: " + xhr.responseText.length);
      assigs2 = buildDataJSON(xhr.responseText);
      //console.log(assigs2);
    };
    xhr.send();
    assigs = assigs1["assigs"].concat(assigs2["assigs"]);
    //console.log(assigs);
  }

  //Called each time we add a new alement to the table
  function addNewRow() {
    var inputVal = $("#inputAssig").val().toUpperCase();
    var grupVal = $("#inputGrup").val();
    toastr.options = {
      "newestOnTop": true,
      "positionClass": "toast-bottom-center",
      "preventDuplicates": true,
      "showDuration": "150",
      "hideDuration": "500",
      "timeOut": "2000"
    };
    if (inputVal.length <= 0) {
      toastr.error("El camp d'entrada està buit");
      return false;
    } else if (grupVal < 10 || grupVal > 99) {
      toastr.error("Grup conté un valor incorrecte");
      return false;
    } else {
      retrieveData();
      updateHTML(inputVal, grupVal);
      refreshTable();
    }
    return true;
  }
  //Add new row to the table
  $("#addBtn").click(function() {
    if (addNewRow()) {
      $("#inputAssig").val("");
      $("#inputGrup").val("");
    }
    return false;
  });

  $("#refreshBtn").click(function() {
    if (!justPressed) {
      refreshTable();
      justPressed = true;
      setTimeout(() => {justPressed = false;}, 1000);
      toastr.options = {
        "newestOnTop": true,
        "positionClass": "toast-bottom-center",
        "showDuration": "150",
        "hideDuration": "500",
        "timeOut": "2000"
      }
      toastr.info("Dades recarregades amb èxit");
    }
  });

  $("#assigForm").each(function() {
    $(this).find('input').keypress(function(e) {
      //Enter so send data as well
      if (e.which == 10 || e.which == 13) {
        if (addNewRow()) {
          $("#inputAssig").val("");
          $("#inputGrup").val("");
        }
        return false;
      }
    });
    $(this).find('input[type=submit]').hide();
  });

  $(document).on('click', 'button.delBtn', function () {
    var rowIndex = $(this).attr('row');
    $('#assig' + rowIndex).remove();
    chrome.storage.local.remove(rowIndex);
    --numberOfAssigs;
    return false;
  });
});
window.onload = function() {
  var inputAssig = document.getElementById('inputAssig');
  inputAssig.focus();
  inputAssig.select();
}
