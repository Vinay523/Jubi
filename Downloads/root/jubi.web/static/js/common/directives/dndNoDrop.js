var dndNoDropObj = {};
dndNoDropObj.dndNoDrop = function () {
    return {
        restrict: 'A',
        link: function (scope, element) {

            function preventDrag(event) {
                if (event.type == 'dragenter' || event.type == 'dragover' || //if drag over event -- allows for drop event to be captured, in case default for this is to not allow drag over target
                    event.type == 'drop') //prevent text dragging -- IE and new Mozilla (like Firefox 3.5+)
                {
                    if (event.stopPropagation) //(Mozilla)
                    {
                        event.preventDefault();
                        event.stopPropagation(); //prevent drag operation from bubbling up and causing text to be modified on old Mozilla (before Firefox 3.5, which doesn't have drop event -- this avoids having to capture old dragdrop event)
                    }
                    return false; //(IE)
                }
            }
            var elem = element[0];
            if (elem.addEventListener) //(Mozilla)
            {
                elem.addEventListener('dragenter', preventDrag, true); //precursor for drop event
                elem.addEventListener('dragover', preventDrag, true); //precursor for drop event
                elem.addEventListener('drop', preventDrag, true);
            }
            else if (elem.attachEvent) //(IE)
            {
                elem.attachEvent('ondragenter', preventDrag);
                elem.attachEvent('ondragover', preventDrag);
                elem.attachEvent('ondrop', preventDrag);
            }
        }
    };
};
