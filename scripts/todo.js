
(function () {
    'use strict';
    var dataCacheName = 'ToDo-userData';

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then(function () { });
    }

    loadFirstPage();
    var app = {
    };


    function loadFirstPage() {
        var url = '/data/login.json';
        var loggedIn = false;
        if ('caches' in window) {
            caches.match(url).then(function (response) {
                if (response) {
                    var json = response.json();
                    json.then(function updateFromCache(json) {
                        loggedIn = true;
                        app.name = json.Name;
                        app.userId = json.UserId;
                        app.email = json.Email;
                        redirectToHomePage();
                    });
                }

            });
        }
        if (!loggedIn) {
            var request = new XMLHttpRequest();
            request.onreadystatechange = function () {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status === 200) {
                        hideLoading("loader");
                        document.getElementById("main").innerHTML = request.response;
                        loadLoginPage();
                    }
                }
            }
        }
        request.open('GET', "/shell/login.html");
        request.send();
    }

    function showSignup() {
        document.getElementById("NameTd").className = "";
        document.getElementById("CofirmPasswordTd").className = "";
        document.getElementById("Login").className = "hide";
        document.getElementById("singup").className = "";
        document.getElementById("signupLink").className = "hide";
        document.getElementById("singup").addEventListener('click', signup);
    }

    function loadLoginPage() {
        document.getElementById("Login").addEventListener('click', login);
        document.getElementById("signupLink").addEventListener('click', showSignup);
    }

    function login() {
        var email = document.getElementById("emailID").value;
        var password = document.getElementById("password").value;
        if (validateLogin()) {
            var ref = database.ref("Users/");
            var listener = ref.orderByChild("Email").equalTo(email).on("value", function (snapshot) {
                var val = snapshot.val();
                if (val) {
                    for (var key in val) {
                        if (val[key].Password == password) {
                            app.userId = key;
                            app.name = val[key].Name;
                            app.email = email;
                            loginSuccess();
                            destroyListener(ref.orderByChild("Email").equalTo(email), listener);
                        } else {
                            loginFailure();
                            destroyListener(ref.orderByChild("Email").equalTo(email), listener);
                        }
                        return;
                    }
                } else {
                    alert("Account not found");
                    destroyListener(ref.orderByChild("Email").equalTo(email), listener);
                }
            });
        } else {
            //error handling
        }

    }

    function validateLogin() {
        return true;
    }

    function signup() {
        if (validateSignup()) {
            var email = document.getElementById("emailID").value;
            var name = document.getElementById("Name").value;
            var password = document.getElementById("password").value;
            if (pushUser(email, name, password)) {
                app.name = name;
                app.email = email;
                redirectToHomePage();
            } else {
                alert("Not able to create account");
            }
        } else {
            alert("Enter proper details");
        }
    }

    function loginSuccess() {
        var json = "{\"Name\" : \"" + app.name + "\",\"Email\":\"" + app.email + "\",\"UserId\":\"" + app.userId + "\"}";
        caches.open(dataCacheName).then(function (cache) {
            var response = new Response(json);
            cache.put("/data/login.json", response);
        });
        redirectToHomePage();
    }

    function loginFailure() {
        alert("Login failure");
    }

    function redirectToHomePage() {
        document.getElementById("pullMenuTd").className = "hide";
        document.getElementById("main").className = "hide";
        showLoading("loader");
        loadToDos();
    }

    function validateSignup() {
        return true;
    }

    function pushUser(email, name, password) {
        var ref = database.ref("Users");
        var key = ref.push({
            Name: name,
            Email: email,
            Password: password,
        });
        app.userId = key.key;
        return true;
    }

    function loadToDos() {
        unhideOptions();
        document.getElementById("footer").className = "footer";
        fetchToDosIds();
        document.getElementById("allTodosDiv").className = "";
        hideLoading("loader");
        document.getElementById("plus").addEventListener('click', addNewTodo)
    }

    function unhideOptions() {
        document.getElementById("pullMenuTd").className = "hide";
        document.getElementById("pullMenuTd").addEventListener('click', redirectBackToHomePage);
        document.getElementById("themeTd").className = "";
        document.getElementById("themeTd").addEventListener('click', switchTheme);
        document.getElementById("profielTd").className = "";
        document.getElementById("profielTd").addEventListener('click', showUserProfile);
    }

    function switchTheme() {
        alert("Theme switch should happen. Yet to be implemented");
    }

    function showUserProfile() {
        alert("User profile should be shown. Yet to be implemented");
    }

    function fetchToDosIds() {
        var ref = database.ref("UserTodo/");
        var listener = ref.orderByChild("User").equalTo(app.userId).on("value", function (snapshot) {
            var val = snapshot.val();
            if (val) {
                var todoIds = [];
                for (var todo in val) {
                    var id = val[todo];
                    var todoID = id.Todo;
                    todoIds.push(todoID);
                }
                showTodos(todoIds);
            } else {
                showNoTodos();
            }
            destroyListener(ref.orderByChild("User").equalTo(app.userId), listener);
        });

    }

    function showTodos(todoIds) {
        var template = fetchTodOTemplate();
        var count = 1;
        for (var i in todoIds) {
            showTodo(template, todoIds[i], count);
            count++;
        }
        app.count = count;
    }

    function showNoTodos() {
        fetchPage("/shell/noTodos.html", "main");
    }

    function fetchTodOTemplate() {
        return document.getElementById("themeVal").value;
    }

    function showTodo(template, todoId, count) {
        var ref = database.ref("Todo/" + todoId);
        var listener = ref.on("value", function (snapshot) {
            var val = snapshot.val();
            if (val) {
                if (template == 1) {
                    showBox(val, count, todoId);
                }
            } else {
                //alert("Something went wrong");
            }
            destroyListener(ref,listener);
        });
    }

    function showBox(val, count, todoId) {
        var name = val.Name;
        var lastModified = val.LastModified;
        var items = val.Items;
        var itemsContent = document.createElement('div');
        itemsContent = getItemsContent(items, todoId);
        var tdContent = '<h1 id="Title' + todoId + '">' + name + '</h1>' +
            '<input type="hidden" value="' + lastModified + '"id="time' + todoId + '"/>' +
            '<div id="items' + todoId + '"></div>';
        var td = document.createElement('td');
        td.id = "Todo" + todoId;
        td.className = "todoTd";
        td.innerHTML = tdContent;
        var deleteBtn = document.createElement("button");
        deleteBtn.id = "deleteTodo" + todoId;
        deleteBtn.className = "todoDelete";
        td.appendChild(deleteBtn);
        if (count % 2 == 1) {
            var tr = document.createElement('tr');
            var trCount = (count + 1) / 2;
            tr.id = "todoTR" + trCount;
            tr.appendChild(td);
            document.getElementById("allTodos").appendChild(tr);
        } else {
            var trCount = count / 2;
            var finaltr = document.getElementById("todoTR" + trCount);
            finaltr.appendChild(td);
        }
        document.getElementById("items" + todoId).appendChild(itemsContent);
        document.getElementById("Title" + todoId).addEventListener('click', function () { showSingleNoteView(todoId); });
        document.getElementById("deleteTodo" + todoId).addEventListener('click', function () { deleteTodo(todoId); });
    }

    function getItemsContent(items, todoId) {
        var div = document.createElement('div');
        div.id = "itemDiv" + todoId;
        div.className = "hide";
        var ul = document.createElement('ul');
        ul.style = "list-style: none;";
        for (var itemKey in items) {
            var itemContent = items[itemKey];
            var li = getOneItemElement(itemContent.Text, itemContent.Done, todoId, itemKey);
            ul.appendChild(li);
        }
        var addItemButton = document.createElement('button');
        addItemButton.id = "itemAdd" + todoId;
        addItemButton.className = "itemAdd";
        addItemButton.addEventListener('click', function () { addNewItem("itemAdd" + todoId) });
        var addItemLi = document.createElement("li");
        addItemLi.id = "addItemLi" + todoId;
        addItemLi.appendChild(addItemButton);
        ul.appendChild(addItemLi);

        div.appendChild(ul);
        return div;
    }

    function addNewTodo() {
        var title = document.getElementById("newTodoTitle").value;
        pushNewTodO(title);
    }

    function pushNewTodO(title) {
        var ref = database.ref("Todo");
        var val = {
            Name: title,
            LastModified: -1,
        }
        var key = ref.push(val);
        var toDoId = key.key;
        var ref = database.ref("UserTodo");
        var key = ref.push({
            User: app.userId,
            Todo: toDoId,
        });
        app.count++;
        showTodo(fetchTodOTemplate(), toDoId, app.count);
        showSingleNoteView(toDoId);
    }

    function showSingleNoteView(mainId) {
        document.getElementById("pullMenuTd").className = "";
        var elements = document.getElementsByClassName("todoTd");
        console.log(elements.length);
        while (elements.length > 0) {
            var element = elements[0];
            element.className = "todoTdhide";
            var hideEleId = element.id;
            var itmeEle = document.getElementById("itemDiv" + hideEleId.replace("Todo", ""));
            if (itmeEle) {
                itmeEle.className = "hide";
            }
        }
        document.getElementById("footer").className = "hide";
        var itemDiv = document.getElementById("itemDiv" + mainId);
        if (itemDiv) {
            document.getElementById("itemDiv" + mainId).className = "";
        }

        document.getElementById("Todo" + mainId).className = "todoTd";
    }

    function deleteTodo(toDoId) {
        var listener = database.ref("/UserTodo").orderByChild("Todo").equalTo(toDoId).on('value', function (snapshot) {
            var val = snapshot.val();
            if (val) {
                for (var key in val) {
                    database.ref("/UserTodo/" + key).remove();
                    return;
                }
            }
            destroyListener(database.ref("/UserTodo").orderByChild("Todo").equalTo(toDoId),listener);
        })
        database.ref("/Todo/" + toDoId).remove();
        document.getElementById("Todo" + toDoId).remove();
    }

    function redirectBackToHomePage() {
        document.getElementById("pullMenuTd").className = "";
        var elements = document.getElementsByClassName("todoTd");
        while (elements.length > 0) {
            var element = elements[0];
            console.log("hide" + element.id);
            element.className = "todoTdhide";
        }

        var elements = document.getElementsByClassName("todoTdhide");
        while (elements.length > 0) {
            var element = elements[0];
            element.className = "todoTd";
            var hideEleId = element.id;
            var itmeEle = document.getElementById("itemDiv" + hideEleId.replace("Todo", ""));
            if (itmeEle) {
                itmeEle.className = "hide";
            }
        }
        document.getElementById("footer").className = "footer";
    }

    function addNewItem(id) {
        var addButtonEle = document.getElementById(id);
        var todoId = id.replace("itemAdd", "");
        var parentElement = addButtonEle.parentElement;
        addButtonEle.remove();
        var ref = database.ref("Todo/" + todoId + "/Items");
        var key = ref.push({
            Done: false,
        });
        var itemKey = key.key;
        var newItem = getOneItemElement("", false, todoId, itemKey);
        parentElement.appendChild(newItem);
        parentElement.appendChild(addButtonEle);
    }

    function getOneItemElement(text, done, todoId, itemKey) {
        var itemText = text;
        var itemDone = done;
        var li = document.createElement('li');
        li.id = "item_" + todoId + "_" + itemKey;
        var liCheck = document.createElement('input');
        liCheck.type = "checkbox";
        liCheck.id = "check" + todoId + "_" + itemKey;
        liCheck.checked = itemDone;
        var liText = document.createElement('input');
        liText.type = "text";
        liText.class = "editableText";
        liText.value = itemText;
        liText.id = "TodoItemText_" + todoId + "_" + itemKey;
        liText.addEventListener('blur', function () { updateItem(todoId, itemKey, liText.id) });
        var liDelete = document.createElement("button");
        liDelete.id = "itemDelete_" + todoId + "_" + itemKey;
        liDelete.className = "itemDelete";
        li.appendChild(liCheck);
        li.appendChild(liText);
        li.appendChild(liDelete);
        liCheck.addEventListener('change', function (){checkChange(todoId,itemKey,"check" + todoId + "_" + itemKey)})
        liDelete.addEventListener('click', function () { deleteItem(todoId, itemKey) });
        return li;
    }

    function deleteItem(todoId, itemKey) {
        database.ref("Todo/" + todoId + "/Items/" + itemKey).remove();
        document.getElementById("item_" + todoId + "_" + itemKey).remove();
    }

    function updateItem(todoId, itemKey, id) {
        var text = document.getElementById(id).value;
        if (text && text.trim()!="") {
            var ref = database.ref("Todo/" + todoId + "/Items/" + itemKey);
            ref.update({
                Text: text
            })
        } else {
            console.log("todo"+todoId);
            console.log("itme"+itemKey);
            deleteItem(todoId,itemKey);
        }
    }

    function checkChange(todoId, itemKey, id) {
        var checked = document.getElementById(id).checked;
        id = id.replace("check", "");
        var ref = database.ref("Todo/" + todoId + "/Items/" + itemKey);
        ref.update({
            Done: checked
        })
    }

})();
